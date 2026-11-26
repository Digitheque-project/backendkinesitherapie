import { Injectable, OnModuleInit, OnModuleDestroy, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Notification } from './notification.entity';
import { PatientsService } from '../patients/patients.service';
import { RendezVousService } from '../rendezvous/rendezvous.service';
import { PrescriptionAuthService } from './prescription-auth.service';
import { jourDuChu } from '../common/jour-chu';
import { RattrapageStatuts, statutARenvoyer } from '../common/rattrapage-statut';

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('NotificationsService');
  private timer: NodeJS.Timeout | null = null;
  private readonly rattrapage = new RattrapageStatuts();

  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    private readonly config: ConfigService,
    private readonly patientsService: PatientsService,
    private readonly rendezVousService: RendezVousService,
    private readonly prescriptionAuth: PrescriptionAuthService,
  ) {}

  onModuleInit() {
    // 60 s par défaut (était 30 s) : les interrogations passent par la passerelle,
    // bloquée par le pare-feu de l'hébergeur au-delà d'un certain débit (429).
    const interval = Number(this.config.get('POLL_INTERVAL_MS')) || 60000;
    this.synchroniser().catch(() => {});
    this.timer = setInterval(() => {
      this.synchroniser().catch(() => {});
    }, interval);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // Service Prescription, via la passerelle (routes /prescriptions/...).
  private get prescriptionBase(): string {
    const g = this.prescriptionAuth.gatewayUrl;
    return g ? `${g}/prescriptions` : '';
  }

  async synchroniser(): Promise<void> {
    const base = this.prescriptionBase;
    const identity = await this.prescriptionAuth.getIdentity();
    if (!base || !identity) return;
    const { serviceId: sid, chuId: chu } = identity;

    const headers = await this.prescriptionAuth.authHeaders();

    let prescriptions: any[];
    try {
      const res = await fetch(`${base}/kine?serviceIdDest=${sid}&chuId=${chu}`, {
        headers,
      });
      if (!res.ok) {
        if (res.status === 401) {
          this.logger.warn(
            'Service Prescription : 401 (jeton de service refuse) — verifier JWT_SECRET',
          );
        }
        return;
      }
      prescriptions = await res.json();
    } catch {
      return;
    }
    if (!Array.isArray(prescriptions)) return;

    await this.rattraperStatuts(prescriptions);
    await this.completerPrescripteurPatients(prescriptions);

    for (const p of prescriptions) {
      const nomMedecin = p.prescripteurAffiche || p.nomMedecinPrescripteur || null;
      const exists = await this.repo.findOne({
        where: { prescriptionId: p.id },
      });
      // Demandes reçues avant que le nom soit transmis : complété au passage.
      if (exists && !exists.nomMedecinPrescripteur && nomMedecin) {
        await this.repo.update(exists.id, { nomMedecinPrescripteur: nomMedecin });
      }
      // Pour les prescriptions KINE, le statut est directement sur l'objet
      // (pas de sous-tableau "demandes" imbrique).
      if (p.statut !== 'CREEE' || exists) continue;

      const notif = this.repo.create({
        prescriptionId: p.id,
        demandeId: p.id,
        patientId: p.patientId,
        typeKine: p.autreKine || p.typeKine || p.renseignements,
        urgence: p.urgence,
        diagnostic: p.diagnostic,
        objectifs: p.objectifs,
        renseignements: p.renseignements,
        nomMedecinPrescripteur: nomMedecin,
        statut: 'CREEE',
        lue: false,
        source: 'prescription',
      });
      await this.repo.save(notif);
      this.logger.log(`Nouvelle demande kiné reçue : ${p.patientId}`);

      this.pousserVersServiceExterne(notif).catch(() => {});
    }
  }

  // Patients créés avant que le nom du prescripteur soit transmis : complétés
  // avec la prescription la plus récente qui le porte (liste triée récente d'abord).
  private async completerPrescripteurPatients(prescriptions: any[]): Promise<void> {
    const sansNom = (await this.patientsService.findAll()).filter(
      (pt) => pt.numeroDossier && !pt.nomMedecinPrescripteur,
    );
    for (const pt of sansNom) {
      const p = prescriptions.find(
        (x) => x.patientId === pt.numeroDossier && (x.prescripteurAffiche || x.nomMedecinPrescripteur),
      );
      if (p) {
        await this.patientsService.update(pt.id, {
          nomMedecinPrescripteur: p.prescripteurAffiche || p.nomMedecinPrescripteur,
        });
      }
    }
  }

  // Rattrapage : une demande planifiée ici mais restée « créée » côté service
  // Prescription (envoi échoué, ou planifiée sans envoi) est renvoyée.
  private async rattraperStatuts(prescriptions: any[]): Promise<void> {
    const statutDistant = new Map<string, string>(prescriptions.map((p) => [p.id, p.statut]));
    const locales = await this.repo.find({ where: { statut: In(['PLANIFIEE', 'TERMINEE']) } });
    for (const l of locales) {
      if (!statutDistant.has(l.prescriptionId)) continue;
      const statut = statutARenvoyer(
        l.statut,
        statutDistant.get(l.prescriptionId),
        ['CREEE', 'PLANIFIEE', 'TERMINEE'],
        ['TERMINEE', 'REALISEE', 'ANNULEE', 'REFUSEE'],
      );
      if (!statut) continue;
      const cle = `${l.prescriptionId}:${statut}`;
      if (!this.rattrapage.peutTenter(cle)) continue;
      const ok = await this.envoyerStatut(l.demandeId || l.prescriptionId, statut);
      this.rattrapage.resultat(cle, ok);
      if (ok) this.logger.log(`Rattrapage : statut ${statut} renvoyé pour la prescription ${l.prescriptionId}`);
    }
  }

  // Envoie un statut au service Prescription ; false si l'envoi a échoué.
  private async envoyerStatut(demandeId: string, statut: string): Promise<boolean> {
    const base = this.prescriptionBase;
    if (!base) return false;
    try {
      // Routes PATCH du service Prescription (PUT renvoyait 404).
      const res = await fetch(`${base}/kine/${demandeId}/statut`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(await this.prescriptionAuth.authHeaders()) },
        body: JSON.stringify({ statut }),
      });
      if (!res.ok) {
        this.logger.warn(`Impossible de notifier Prescription (statut ${res.status}) pour la demande ${demandeId}`);
      }
      return res.ok;
    } catch {
      this.logger.warn('Service Prescription injoignable pour la notification de statut');
      return false;
    }
  }

  private async pousserVersServiceExterne(n: Notification): Promise<void> {
    const url = this.prescriptionAuth.gatewayUrl;
    const sid = (await this.prescriptionAuth.getIdentity())?.serviceId;
    if (!url || !sid) return;
    // Nom du patient (Accueil) plutôt que son identifiant brut (26/11/2026).
    const p = await this.recupererPatientAccueil(n.patientId).catch(() => null);
    const nomPatient = [p?.prenom, p?.nom].filter(Boolean).join(' ').trim() || 'patient non identifié';
    try {
      // La passerelle exige un jeton sur /notifications (requiresAuth).
      await fetch(`${url}/notifications/service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await this.prescriptionAuth.authHeaders()) },
        body: JSON.stringify({
          serviceId: sid,
          title: 'Nouvelle demande kiné',
          message: `Prescription kiné pour ${nomPatient}`,
          type: 'demande_created',
          source: 'kine-back',
          data: {
            prescriptionId: n.prescriptionId,
            patientId: n.patientId,
            patientNom: p?.nom || null,
            patientPrenom: p?.prenom || null,
            typeKine: n.typeKine,
          },
        }),
      });
    } catch {
      // non bloquant
    }
  }

  // Service Accueil, via la passerelle (routes /accueil/...).
  private get accueilBase(): string {
    const g = this.prescriptionAuth.gatewayUrl;
    return g ? `${g}/accueil` : '';
  }

  // Recupere tous les patients Accueil en un seul appel (evite N appels).
  private async recupererTousPatientsAccueil(): Promise<Map<string, any>> {
    const map = new Map<string, any>();
    const url = this.accueilBase;
    const chu = (await this.prescriptionAuth.getIdentity())?.chuId;
    if (!url || !chu) return map;
    try {
      const res = await fetch(`${url}/patients?chuId=${chu}`, {
        headers: await this.prescriptionAuth.authHeaders(),
      });
      if (!res.ok) return map;
      const patients = await res.json();
      if (!Array.isArray(patients)) return map;
      for (const p of patients) {
        map.set(p.id, p);
      }
    } catch {
      // service Accueil injoignable : on retourne une map vide (enrichissement non bloquant)
    }
    return map;
  }

  private enrichir(notifs: Notification[], patients: Map<string, any>): any[] {
    return notifs.map((n) => {
      const p = patients.get(n.patientId);
      return {
        ...n,
        patientNom: p?.nom || null,
        patientPrenom: p?.prenom || null,
      };
    });
  }

  async findAll(): Promise<any[]> {
    const notifs = await this.repo.find({ order: { createdAt: 'DESC' } });
    const patients = await this.recupererTousPatientsAccueil();
    return this.enrichir(notifs, patients);
  }

  async findNonLues(): Promise<any[]> {
    const notifs = await this.repo.find({
      where: { lue: false },
      order: { createdAt: 'DESC' },
    });
    const patients = await this.recupererTousPatientsAccueil();
    return this.enrichir(notifs, patients);
  }

  async marquerLue(id: number): Promise<Notification | null> {
    await this.repo.update(id, { lue: true });
    return this.repo.findOne({ where: { id } });
  }

  async marquerPlanifieeParId(id: number): Promise<Notification | null> {
    await this.repo.update(id, { lue: true, statut: 'PLANIFIEE' });
    return this.repo.findOne({ where: { id } });
  }

  async marquerPlanifiee(prescriptionId: string): Promise<void> {
    // Jamais en arrière : une demande déjà terminée le reste.
    await this.repo.update({ prescriptionId, statut: In(['CREEE', 'PLANIFIEE']) }, { statut: 'PLANIFIEE', lue: true });
  }

  // Comme marquerPlanifiee ; si la demande n'a pas encore été récupérée par la
  // synchronisation, elle est créée ici (sinon elle ne le serait jamais : la
  // synchronisation ne prend que les demandes encore « créées »).
  async marquerPlanifieeOuCreer(prescriptionId: string, patientId?: string): Promise<void> {
    const existe = await this.repo.findOne({ where: { prescriptionId } });
    if (existe) {
      await this.marquerPlanifiee(prescriptionId);
      return;
    }
    if (!patientId) return;
    await this.repo.save(
      this.repo.create({
        prescriptionId,
        demandeId: prescriptionId,
        patientId,
        statut: 'PLANIFIEE',
        lue: true,
        source: 'prescription',
      }),
    );
  }

  /**
   * Fin de la prise en charge : les demandes planifiées du patient passent à
   * « terminée » ; le service Prescription en est informé (il prévient le
   * prescripteur), sinon le rattrapage renverra le statut. Le patient est archivé.
   */
  async terminerPriseEnCharge(patientId: number): Promise<{ demandesTerminees: number }> {
    const patient = await this.patientsService.findOne(patientId);
    const demandes = patient.numeroDossier
      ? await this.repo.find({ where: { patientId: patient.numeroDossier, statut: 'PLANIFIEE' } })
      : [];
    for (const d of demandes) {
      await this.repo.update(d.id, { statut: 'TERMINEE', lue: true });
      const cle = `${d.prescriptionId}:TERMINEE`;
      const ok = await this.envoyerStatut(d.demandeId || d.prescriptionId, 'TERMINEE');
      this.rattrapage.resultat(cle, ok);
    }
    // Rendez-vous restés ouverts : celui commencé est effectué, les suivants
    // annulés (sinon ils restaient au tableau de bord et au calendrier).
    const aujourdhui = jourDuChu();
    for (const r of await this.rendezVousService.findAll()) {
      if (r.patientId !== patientId) continue;
      if (r.statut === 'en_cours') await this.rendezVousService.update(r.id, { statut: 'effectue' });
      else if (r.statut === 'planifie' && r.date >= aujourdhui) await this.rendezVousService.update(r.id, { statut: 'annule' });
    }
    await this.patientsService.archiver(patientId);
    return { demandesTerminees: demandes.length };
  }

  // Recupere les infos personnelles du patient depuis le service Accueil.
  private async recupererPatientAccueil(patientId: string): Promise<any | null> {
    const url = this.accueilBase;
    const chu = (await this.prescriptionAuth.getIdentity())?.chuId;
    if (!url || !chu) return null;
    try {
      const res = await fetch(`${url}/patients?chuId=${chu}`, {
        headers: await this.prescriptionAuth.authHeaders(),
      });
      if (!res.ok) return null;
      const patients = await res.json();
      if (!Array.isArray(patients)) return null;
      return patients.find((p: any) => p.id === patientId) || null;
    } catch {
      return null;
    }
  }

  // Informe le service Prescription que la demande a ete traitee (non bloquant).
  private async notifierPrescription(
    prescriptionId: string,
    demandeId: string,
    rdv?: { date: string; heure: string },
  ): Promise<void> {
    const base = this.prescriptionBase;
    if (!base) return;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(await this.prescriptionAuth.authHeaders()),
    };
    try {
      // La date du rendez-vous d'abord : le prescripteur reçoit un seul message,
      // avec la date (le statut « planifiée » qui suit n'en renvoie pas d'autre).
      if (rdv) {
        const resRdv = await fetch(`${base}/kine/${demandeId}/rdv`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ rdvDate: rdv.date, rdvTime: rdv.heure }),
        });
        if (!resRdv.ok) {
          this.logger.warn(`Impossible de transmettre le RDV (statut ${resRdv.status}) pour la demande ${demandeId}`);
        }
      }
      await this.envoyerStatut(demandeId, 'PLANIFIEE');
    } catch {
      this.logger.warn('Service Prescription injoignable pour la notification de statut');
    }
  }

  // Planifie un rendez-vous a partir d'une notification : recupere le patient (Accueil),
  // le cree localement si besoin, cree le rendez-vous, notifie Prescription.
  async planifier(id: number, dateRdv: Date): Promise<{ patientId: number; rendezVousId: number }> {
    const notif = await this.repo.findOne({ where: { id } });
    if (!notif) throw new NotFoundException('Notification introuvable');

    const infosAccueil = await this.recupererPatientAccueil(notif.patientId);

    let patient = (await this.patientsService.findAll()).find(
      (p) => p.numeroDossier === notif.patientId,
    );

    // Patient créé « Inconnu » parce que l'Accueil ne répondait pas : son vrai
    // nom est repris dès que l'Accueil répond (avant, il restait inconnu).
    if (patient && infosAccueil && (patient.nom === 'Inconnu' || !patient.nom)) {
      patient = await this.patientsService.update(patient.id, {
        nom: infosAccueil.nom || patient.nom,
        prenom: infosAccueil.prenom || patient.prenom,
        ...(infosAccueil.dateNaissance ? { dateNaissance: infosAccueil.dateNaissance } : {}),
        ...(infosAccueil.sexe ? { sexe: infosAccueil.sexe } : {}),
      } as any);
    }

    if (patient && (patient.statut === 'archive' || (notif.nomMedecinPrescripteur && !patient.nomMedecinPrescripteur))) {
      // Nouvelle prescription pour un patient dont la prise en charge était close.
      patient = await this.patientsService.update(patient.id, {
        statut: 'actif',
        ...(notif.nomMedecinPrescripteur ? { nomMedecinPrescripteur: notif.nomMedecinPrescripteur } : {}),
      });
    }

    if (!patient) {
      patient = await this.patientsService.create({
        numeroDossier: notif.patientId,
        nom: infosAccueil?.nom || 'Inconnu',
        prenom: infosAccueil?.prenom || '',
        dateNaissance: infosAccueil?.dateNaissance || undefined,
        sexe: infosAccueil?.sexe === 'FEMALE' ? 'F' : infosAccueil?.sexe === 'MALE' ? 'M' : undefined,
        telephone: infosAccueil?.telephone || undefined,
        adresse: infosAccueil?.adresse || undefined,
        diagnostic: notif.diagnostic || undefined,
        nomMedecinPrescripteur: notif.nomMedecinPrescripteur || undefined,
        statut: 'actif',
        dateAdmission: jourDuChu(),
      });
    }

    const heureDebut = dateRdv.toTimeString().slice(0, 5);
    const heureFinDate = new Date(dateRdv.getTime() + 60 * 60000);
    const heureFin = heureFinDate.toTimeString().slice(0, 5);

    const rdv = await this.rendezVousService.create({
      patientId: patient.id,
      date: dateRdv.toISOString().slice(0, 10),
      heureDebut,
      heureFin,
      motif: notif.diagnostic || notif.typeKine || 'Kinesitherapie',
      type: 'soin',
      statut: 'planifie',
    });

    await this.marquerPlanifiee(notif.prescriptionId);
    this.notifierPrescription(notif.prescriptionId, notif.demandeId, {
      date: dateRdv.toISOString().slice(0, 10),
      heure: heureDebut,
    }).catch(() => {});

    return { patientId: patient.id, rendezVousId: rdv.id };
  }
}

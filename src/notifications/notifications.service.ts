import { Injectable, OnModuleInit, OnModuleDestroy, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Notification } from './notification.entity';
import { PatientsService } from '../patients/patients.service';
import { RendezVousService } from '../rendezvous/rendezvous.service';

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('NotificationsService');
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
    private readonly config: ConfigService,
    private readonly patientsService: PatientsService,
    private readonly rendezVousService: RendezVousService,
  ) {}

  onModuleInit() {
    const interval = Number(this.config.get('POLL_INTERVAL_MS')) || 30000;
    this.synchroniser().catch(() => {});
    this.timer = setInterval(() => {
      this.synchroniser().catch(() => {});
    }, interval);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async synchroniser(): Promise<void> {
    const base = this.config.get<string>('PRESCRIPTION_API_URL');
    const sid = this.config.get<string>('KINE_SERVICE_ID');
    const chu = this.config.get<string>('CHU_ID');
    if (!base || !sid) return;

    const token = this.config.get<string>('PRESCRIPTION_API_TOKEN');
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    let prescriptions: any[];
    try {
      const res = await fetch(`${base}/kine?serviceIdDest=${sid}&chuId=${chu}`, {
        headers,
      });
      if (!res.ok) {
        if (res.status === 401) {
          this.logger.warn(
            'Service Prescription : 401 (token JWT manquant ou invalide) — renseigner PRESCRIPTION_API_TOKEN',
          );
        }
        return;
      }
      prescriptions = await res.json();
    } catch {
      return;
    }
    if (!Array.isArray(prescriptions)) return;

    for (const p of prescriptions) {
      // Pour les prescriptions KINE, le statut est directement sur l'objet
      // (pas de sous-tableau "demandes" imbrique).
      if (p.statut !== 'CREEE') continue;

      const exists = await this.repo.findOne({
        where: { prescriptionId: p.id },
      });
      if (exists) continue;

      const notif = this.repo.create({
        prescriptionId: p.id,
        demandeId: p.id,
        patientId: p.patientId,
        typeKine: p.autreKine || p.typeKine || p.renseignements,
        urgence: p.urgence,
        diagnostic: p.diagnostic,
        renseignements: p.renseignements,
        statut: 'CREEE',
        lue: false,
        source: 'prescription',
      });
      await this.repo.save(notif);
      this.logger.log(`Nouvelle demande kiné reçue : ${p.patientId}`);

      this.pousserVersServiceExterne(notif).catch(() => {});
    }
  }

  private async pousserVersServiceExterne(n: Notification): Promise<void> {
    const url = this.config.get<string>('NOTIFICATION_API_URL');
    const sid = this.config.get<string>('KINE_SERVICE_ID');
    if (!url || !sid) return;
    try {
      await fetch(`${url}/notifications/service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: sid,
          title: 'Nouvelle demande kiné',
          message: `Prescription kiné pour le patient ${n.patientId}`,
          type: 'demande_created',
          source: 'kine-back',
          data: {
            prescriptionId: n.prescriptionId,
            patientId: n.patientId,
            typeKine: n.typeKine,
          },
        }),
      });
    } catch {
      // non bloquant
    }
  }

  // Recupere tous les patients Accueil en un seul appel (evite N appels).
  private async recupererTousPatientsAccueil(): Promise<Map<string, any>> {
    const map = new Map<string, any>();
    const url = this.config.get<string>('ACCUEIL_API_URL');
    const chu = this.config.get<string>('CHU_ID');
    if (!url || !chu) return map;
    try {
      const res = await fetch(`${url}/patients?chuId=${chu}`);
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
    await this.repo.update({ prescriptionId }, { statut: 'PLANIFIEE', lue: true });
  }

  // Recupere les infos personnelles du patient depuis le service Accueil.
  private async recupererPatientAccueil(patientId: string): Promise<any | null> {
    const url = this.config.get<string>('ACCUEIL_API_URL');
    const chu = this.config.get<string>('CHU_ID');
    if (!url || !chu) return null;
    try {
      const res = await fetch(`${url}/patients?chuId=${chu}`);
      if (!res.ok) return null;
      const patients = await res.json();
      if (!Array.isArray(patients)) return null;
      return patients.find((p: any) => p.id === patientId) || null;
    } catch {
      return null;
    }
  }

  // Informe le service Prescription que la demande a ete traitee (non bloquant).
  private async notifierPrescription(prescriptionId: string, demandeId: string): Promise<void> {
    const base = this.config.get<string>('PRESCRIPTION_API_URL');
    const token = this.config.get<string>('PRESCRIPTION_API_TOKEN');
    if (!base) return;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      const res = await fetch(`${base}/kine/${demandeId}/statut`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ statut: 'PLANIFIEE' }),
      });
      if (!res.ok) {
        this.logger.warn(
          `Impossible de notifier Prescription (statut ${res.status}) pour la demande ${demandeId} — route peut-etre absente cote Prescription`,
        );
      }
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
        statut: 'actif',
        dateAdmission: new Date().toISOString().slice(0, 10),
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
    this.notifierPrescription(notif.prescriptionId, notif.demandeId).catch(() => {});

    return { patientId: patient.id, rendezVousId: rdv.id };
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seance } from './seance.entity';
import { Patient } from '../patients/patient.entity';

@Injectable()
export class SeancesService {
  constructor(
    @InjectRepository(Seance)
    private repo: Repository<Seance>,
  ) {}

  findAll(): Promise<Seance[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findByPatient(patientId: number): Promise<Seance[]> {
    return this.repo.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
    });
  }
  findByPatientValidees(patientId: number): Promise<Seance[]> {
    return this.repo.find({
      where: { patientId, valide: true },
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: Partial<Seance>): Promise<Seance> {
    // Instantané de la prise en charge en cours (prescription, bilan) : la
    // fiche patient change à la prescription suivante, pas la séance.
    const patient = data.patientId
      ? await this.repo.manager.findOne(Patient, { where: { id: data.patientId } })
      : null;
    const bilanPatient = [patient?.bilanFonctionnel, patient?.bilanIncapacite].filter(Boolean).join(' — ');
    // Une séance enregistrée par le front est une séance faite et validée.
    const seance = this.repo.create({
      valide: true,
      diagnostic: patient?.diagnostic || undefined,
      objectifs: patient?.objectifs || undefined,
      nomMedecinPrescripteur: patient?.nomMedecinPrescripteur || undefined,
      diagnosticKine: patient?.diagnosticKine || undefined,
      bilan: bilanPatient || undefined,
      ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== '')),
    });
    return this.repo.save(seance);
  }

  async update(id: number, data: Partial<Seance>): Promise<Seance> {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } }) as Promise<Seance>;
  }
}

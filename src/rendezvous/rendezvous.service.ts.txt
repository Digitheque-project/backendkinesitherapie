import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RendezVous } from './rendezvous.entity';
import { Patient } from '../patients/patient.entity';

@Injectable()
export class RendezVousService {
  constructor(
    @InjectRepository(RendezVous)
    private repo: Repository<RendezVous>,
    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
  ) {}

  async findAll(): Promise<RendezVous[]> {
    return this.repo.find({ relations: { patient: true } });
  }

  async findOne(id: number): Promise<RendezVous> {
    const rdv = await this.repo.findOne({ where: { id }, relations: { patient: true } });
    if (!rdv) throw new NotFoundException('Rendez-vous introuvable');
    return rdv;
  }

  async create(data: Partial<RendezVous>): Promise<RendezVous> {
    const patient = await this.patientRepo.findOne({ where: { id: data.patientId } });
    if (!patient) throw new NotFoundException('Patient introuvable');
    const rdv = this.repo.create(data);
    return this.repo.save(rdv);
  }

  async update(id: number, data: Partial<RendezVous>): Promise<RendezVous> {
    const rdv = await this.findOne(id);
    Object.assign(rdv, data);
    return this.repo.save(rdv);
  }

  async remove(id: number): Promise<void> {
    const rdv = await this.findOne(id);
    await this.repo.remove(rdv);
  }
}

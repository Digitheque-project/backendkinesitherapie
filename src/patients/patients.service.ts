import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patient.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private repo: Repository<Patient>,
  ) {}

  findAll(): Promise<Patient[]> {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  async findOne(id: number): Promise<Patient> {
    const patient = await this.repo.findOne({ where: { id } });
    if (!patient) throw new NotFoundException('Patient introuvable');
    return patient;
  }

  create(data: Partial<Patient>): Promise<Patient> {
    if (!data || !data.nom || !data.prenom) {
      throw new BadRequestException(
        'Les champs nom et prénom sont requis pour créer un patient',
      );
    }
    const patient = this.repo.create(data);
    return this.repo.save(patient);
  }

  async update(id: number, data: Partial<Patient>): Promise<Patient> {
    const patient = await this.findOne(id);
    Object.assign(patient, data);
    return this.repo.save(patient);
  }

  async archiver(id: number): Promise<Patient> {
    const patient = await this.findOne(id);
    patient.statut = 'archive';
    return this.repo.save(patient);
  }

  async remove(id: number): Promise<void> {
    const patient = await this.findOne(id);
    await this.repo.remove(patient);
  }
}

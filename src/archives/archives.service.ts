import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Archive } from './archive.entity';
import { Patient } from '../patients/patient.entity';

@Injectable()
export class ArchivesService {
  constructor(
    @InjectRepository(Archive)
    private repo: Repository<Archive>,
    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
  ) {}

  findAll(): Promise<Archive[]> {
    return this.repo.find({ relations: { patient: true }, order: { id: 'DESC' } });
  }

  async findOne(id: number): Promise<Archive> {
    const archive = await this.repo.findOne({ where: { id }, relations: { patient: true } });
    if (!archive) throw new NotFoundException('Archive introuvable');
    return archive;
  }

  async create(data: Partial<Archive>): Promise<Archive> {
    const patient = await this.patientRepo.findOne({ where: { id: data.patientId } });
    if (!patient) throw new NotFoundException('Patient introuvable');
    const archive = this.repo.create(data);
    return this.repo.save(archive);
  }

  async update(id: number, data: Partial<Archive>): Promise<Archive> {
    const archive = await this.findOne(id);
    Object.assign(archive, data);
    return this.repo.save(archive);
  }

  async remove(id: number): Promise<void> {
    const archive = await this.findOne(id);
    await this.repo.remove(archive);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seance } from './seance.entity';

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

  create(data: Partial<Seance>): Promise<Seance> {
    const seance = this.repo.create(data);
    return this.repo.save(seance);
  }

  async update(id: number, data: Partial<Seance>): Promise<Seance> {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } }) as Promise<Seance>;
  }
}

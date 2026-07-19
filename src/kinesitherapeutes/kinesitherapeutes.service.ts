import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kinesitherapeute } from './kinesitherapeute.entity';

@Injectable()
export class KinesitherapeutesService {
  constructor(
    @InjectRepository(Kinesitherapeute)
    private repo: Repository<Kinesitherapeute>,
  ) {}

  findAll(): Promise<Kinesitherapeute[]> {
    return this.repo.find();
  }

  async findOne(id: number): Promise<Kinesitherapeute> {
    const kine = await this.repo.findOne({ where: { id } });
    if (!kine) throw new NotFoundException('Kinésithérapeute introuvable');
    return kine;
  }

  create(data: Partial<Kinesitherapeute>): Promise<Kinesitherapeute> {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Kinesitherapeute>): Promise<Kinesitherapeute> {
    const kine = await this.findOne(id);
    Object.assign(kine, data);
    return this.repo.save(kine);
  }

  async remove(id: number): Promise<void> {
    const kine = await this.findOne(id);
    await this.repo.remove(kine);
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RendezVous } from './rendezvous.entity';
import { RendezVousService } from './rendezvous.service';
import { RendezVousController } from './rendezvous.controller';
import { Patient } from '../patients/patient.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RendezVous, Patient])],
  controllers: [RendezVousController],
  providers: [RendezVousService],
})
export class RendezVousModule {}

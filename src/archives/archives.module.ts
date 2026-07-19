import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Archive } from './archive.entity';
import { ArchivesService } from './archives.service';
import { ArchivesController } from './archives.controller';
import { Patient } from '../patients/patient.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Archive, Patient])],
  controllers: [ArchivesController],
  providers: [ArchivesService],
})
export class ArchivesModule {}

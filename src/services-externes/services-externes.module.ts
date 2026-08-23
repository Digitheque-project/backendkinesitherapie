import { Module } from '@nestjs/common';
import { ServicesExternesController } from './services-externes.controller';
import { PatientsModule } from '../patients/patients.module';
import { SeancesModule } from '../seances/seances.module';

@Module({
  imports: [PatientsModule, SeancesModule],
  controllers: [ServicesExternesController],
})
export class ServicesExternesModule {}

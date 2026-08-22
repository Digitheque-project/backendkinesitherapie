import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationsService } from './notifications.service';
import { PrescriptionAuthService } from './prescription-auth.service';
import { NotificationsController } from './notifications.controller';
import { PatientsModule } from '../patients/patients.module';
import { RendezVousModule } from '../rendezvous/rendezvous.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    PatientsModule,
    RendezVousModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, PrescriptionAuthService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

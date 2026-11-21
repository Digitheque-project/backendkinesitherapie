import { Controller, Get, Patch, Post, Param, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from './notification.entity';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  findAll(): Promise<any[]> {
    return this.service.findAll();
  }

  @Get('non-lues')
  findNonLues(): Promise<any[]> {
    return this.service.findNonLues();
  }

  @Post('sync')
  async sync(): Promise<{ ok: boolean }> {
    await this.service.synchroniser();
    return { ok: true };
  }

  @Patch(':id/lire')
  marquerLue(@Param('id') id: string): Promise<Notification | null> {
    return this.service.marquerLue(+id);
  }

  @Patch(':id/planifiee')
  marquerPlanifiee(@Param('id') id: string) {
    return this.service.marquerPlanifieeParId(+id);
  }

  // Planification faite depuis la page « Demandes » du front (par prescription).
  @Patch('prescription/:prescriptionId/planifiee')
  async marquerPlanifieeParPrescription(
    @Param('prescriptionId') prescriptionId: string,
    @Body() body: { patientId?: string },
  ) {
    await this.service.marquerPlanifieeOuCreer(prescriptionId, body?.patientId);
    return { ok: true };
  }

  // Fin de la prise en charge d'un patient local : ses demandes planifiées
  // passent à « terminée » (envoyé au service Prescription) et il est archivé.
  @Post('terminer-patient/:patientId')
  terminerPriseEnCharge(@Param('patientId') patientId: string) {
    return this.service.terminerPriseEnCharge(+patientId);
  }

  // Planifie un rendez-vous a partir d'une notification (body: { dateRdv: string ISO })
  @Post(':id/planifier')
  async planifier(
    @Param('id') id: string,
    @Body() body: { dateRdv: string },
  ) {
    return this.service.planifier(+id, new Date(body.dateRdv));
  }
}

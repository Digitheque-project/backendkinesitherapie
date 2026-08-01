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

  // Planifie un rendez-vous a partir d'une notification (body: { dateRdv: string ISO })
  @Post(':id/planifier')
  async planifier(
    @Param('id') id: string,
    @Body() body: { dateRdv: string },
  ) {
    return this.service.planifier(+id, new Date(body.dateRdv));
  }
}

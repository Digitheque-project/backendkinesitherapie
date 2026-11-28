import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { RendezVousService } from './rendezvous.service';
import { RendezVous } from './rendezvous.entity';

@Controller('rendezvous')
export class RendezVousController {
  constructor(private readonly service: RendezVousService) {}

  @Get()
  findAll(): Promise<RendezVous[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<RendezVous> {
    return this.service.findOne(+id);
  }

  @Post()
  async create(@Body() data: Partial<RendezVous>): Promise<RendezVous> {
    const rdv = await this.service.create(data);
    this.service.signalerNouveauRdv(rdv);
    return rdv;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<RendezVous>): Promise<RendezVous> {
    const rdv = await this.service.update(+id, data);
    // Rendez-vous déplacé : le prescripteur reçoit la nouvelle date.
    if ((data.date || data.heureDebut) && rdv.statut === 'planifie') this.service.signalerNouveauRdv(rdv);
    return rdv;
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(+id);
  }
}

import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { SeancesService } from './seances.service';
import { Seance } from './seance.entity';

@Controller('seances')
export class SeancesController {
  constructor(private readonly service: SeancesService) {}

  @Get()
  findAll(@Query('patientId') patientId?: string): Promise<Seance[]> {
    if (patientId) return this.service.findByPatient(+patientId);
    return this.service.findAll();
  }

  @Post()
  create(@Body() data: Partial<Seance>): Promise<Seance> {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<Seance>): Promise<Seance> {
    return this.service.update(+id, data);
  }
}

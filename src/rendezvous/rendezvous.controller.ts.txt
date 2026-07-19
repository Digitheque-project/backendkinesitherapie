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
  create(@Body() data: Partial<RendezVous>): Promise<RendezVous> {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<RendezVous>): Promise<RendezVous> {
    return this.service.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(+id);
  }
}

import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { KinesitherapeutesService } from './kinesitherapeutes.service';
import { Kinesitherapeute } from './kinesitherapeute.entity';

@Controller('kinesitherapeutes')
export class KinesitherapeutesController {
  constructor(private readonly service: KinesitherapeutesService) {}

  @Get()
  findAll(): Promise<Kinesitherapeute[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Kinesitherapeute> {
    return this.service.findOne(+id);
  }

  @Post()
  create(@Body() data: Partial<Kinesitherapeute>): Promise<Kinesitherapeute> {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<Kinesitherapeute>): Promise<Kinesitherapeute> {
    return this.service.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(+id);
  }
}

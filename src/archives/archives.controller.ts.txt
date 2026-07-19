import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ArchivesService } from './archives.service';
import { Archive } from './archive.entity';

@Controller('archives')
export class ArchivesController {
  constructor(private readonly service: ArchivesService) {}

  @Get()
  findAll(): Promise<Archive[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Archive> {
    return this.service.findOne(+id);
  }

  @Post()
  create(@Body() data: Partial<Archive>): Promise<Archive> {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<Archive>): Promise<Archive> {
    return this.service.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(+id);
  }
}

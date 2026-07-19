import { Controller, Get, Post, Put, Patch, Delete, Param, Body } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { Patient } from './patient.entity';

@Controller('patients')
export class PatientsController {
  constructor(private readonly service: PatientsService) {}

  @Get()
  findAll(): Promise<Patient[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Patient> {
    return this.service.findOne(+id);
  }

  @Post()
  create(@Body() data: Partial<Patient>): Promise<Patient> {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<Patient>): Promise<Patient> {
    return this.service.update(+id, data);
  }

  @Patch(':id/archiver')
  archiver(@Param('id') id: string): Promise<Patient> {
    return this.service.archiver(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(+id);
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Seance } from './seance.entity';
import { SeancesService } from './seances.service';
import { SeancesController } from './seances.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Seance])],
  controllers: [SeancesController],
  providers: [SeancesService],
  exports: [SeancesService],
})
export class SeancesModule {}

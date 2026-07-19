import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Kinesitherapeute } from './kinesitherapeute.entity';
import { KinesitherapeutesService } from './kinesitherapeutes.service';
import { KinesitherapeutesController } from './kinesitherapeutes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Kinesitherapeute])],
  controllers: [KinesitherapeutesController],
  providers: [KinesitherapeutesService],
  exports: [KinesitherapeutesService],
})
export class KinesitherapeutesModule {}

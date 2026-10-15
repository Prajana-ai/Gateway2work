import { Module } from '@nestjs/common';
import { TrainingsService } from './trainings.service';
import { TrainingsController } from './trainings.controller';
import { TrainingsRepository } from './trainings.repository';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TrainingsController],
  providers: [TrainingsService, TrainingsRepository],
  exports: [TrainingsService],
})
export class TrainingsModule {}

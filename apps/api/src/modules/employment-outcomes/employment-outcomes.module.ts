import { Module } from '@nestjs/common';
import { EmploymentOutcomesController } from './employment-outcomes.controller';
import { EmploymentOutcomesService } from './employment-outcomes.service';
import { EmploymentOutcomesRepository } from './employment-outcomes.repository';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [EmploymentOutcomesController],
  providers: [EmploymentOutcomesService, EmploymentOutcomesRepository],
  exports: [EmploymentOutcomesService],
})
export class EmploymentOutcomesModule {}

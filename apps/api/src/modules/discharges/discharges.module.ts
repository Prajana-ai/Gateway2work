import { Module } from '@nestjs/common';
import { DischargesController } from './discharges.controller';
import { DischargesService } from './discharges.service';
import { DischargesRepository } from './discharges.repository';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [DischargesController],
  providers: [DischargesService, DischargesRepository],
  exports: [DischargesService],
})
export class DischargesModule {}

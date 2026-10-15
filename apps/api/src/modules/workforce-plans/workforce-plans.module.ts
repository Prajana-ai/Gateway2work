import { Module } from '@nestjs/common';
import { WorkforcePlansController } from './workforce-plans.controller';
import { WorkforcePlansService } from './workforce-plans.service';
import { WorkforcePlansRepository } from './workforce-plans.repository';

@Module({
  controllers: [WorkforcePlansController],
  providers: [WorkforcePlansService, WorkforcePlansRepository],
  exports: [WorkforcePlansService],
})
export class WorkforcePlansModule {}

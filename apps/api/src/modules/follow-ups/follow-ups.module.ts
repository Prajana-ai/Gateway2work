import { Module } from '@nestjs/common';
import { FollowUpsController } from './follow-ups.controller';
import { FollowUpsService } from './follow-ups.service';
import { FollowUpsRepository } from './follow-ups.repository';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [FollowUpsController],
  providers: [FollowUpsService, FollowUpsRepository],
  exports: [FollowUpsService],
})
export class FollowUpsModule {}

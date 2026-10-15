import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ParticipantCheckInsController } from './participant-check-ins.controller';
import { ParticipantCheckInsService } from './participant-check-ins.service';
import { ParticipantCheckInsRepository } from './participant-check-ins.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [ParticipantCheckInsController],
  providers: [ParticipantCheckInsService, ParticipantCheckInsRepository],
})
export class ParticipantCheckInsModule {}

import { Module } from '@nestjs/common';
import { EncountersController } from './encounters.controller';
import { EncountersService } from './encounters.service';
import { EncountersRepository } from './encounters.repository';

@Module({
  controllers: [EncountersController],
  providers: [EncountersService, EncountersRepository],
  exports: [EncountersService],
})
export class EncountersModule {}

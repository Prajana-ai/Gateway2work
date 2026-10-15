import { Injectable } from '@nestjs/common';
import {
  ParticipantCheckInsRepository,
  CheckInRecord,
} from './participant-check-ins.repository';

@Injectable()
export class ParticipantCheckInsService {
  constructor(
    private readonly repo: ParticipantCheckInsRepository,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    role: string,
    dto: {
      participantId: string;
      feeling: number;
      employmentStatus: string;
      hoursWorked: number;
      hoursSearching: number;
      hoursPrepping: number;
      challenges: string;
      needsHelp: string[];
    },
  ): Promise<CheckInRecord> {
    return this.repo.create(tenantId, userId, role, dto);
  }

  async findByParticipant(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<CheckInRecord[]> {
    return this.repo.findByParticipant(tenantId, userId, role, participantId);
  }
}

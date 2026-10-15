import { Injectable } from '@nestjs/common';
import { FollowUpsRepository, FollowUpRow } from './follow-ups.repository';
import { CreateFollowUpDto } from '@impactforge/shared';

@Injectable()
export class FollowUpsService {
  constructor(private readonly followUpsRepository: FollowUpsRepository) {}

  async listByParticipant(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<FollowUpRow[]> {
    return this.followUpsRepository.findAllByParticipant(
      tenantId,
      userId,
      role,
      participantId,
    );
  }

  async create(
    tenantId: string,
    userId: string,
    role: string,
    dto: CreateFollowUpDto,
  ): Promise<FollowUpRow> {
    return this.followUpsRepository.create(tenantId, userId, role, dto);
  }
}

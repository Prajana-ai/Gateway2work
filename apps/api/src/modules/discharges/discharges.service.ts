import { Injectable, NotFoundException } from '@nestjs/common';
import { DischargesRepository } from './discharges.repository';
import { CreateDischargeDto, UpdateDischargeDto } from '@impactforge/shared';

@Injectable()
export class DischargesService {
  constructor(private readonly repository: DischargesRepository) {}

  async create(tenantId: string, userId: string, role: string, dto: CreateDischargeDto) {
    return this.repository.create(tenantId, userId, role, dto);
  }

  async findByParticipantId(tenantId: string, userId: string, role: string, participantId: string) {
    return this.repository.findByParticipantId(tenantId, userId, role, participantId);
  }

  async update(tenantId: string, userId: string, role: string, id: string, dto: UpdateDischargeDto) {
    const discharge = await this.repository.update(tenantId, userId, role, id, dto);
    if (!discharge) {
      throw new NotFoundException('Discharge record not found');
    }
    return discharge;
  }
}

import { Injectable } from '@nestjs/common';
import { EmploymentOutcomesRepository } from './employment-outcomes.repository';
import { CreateEmploymentOutcomeDto } from '@impactforge/shared';

@Injectable()
export class EmploymentOutcomesService {
  constructor(private readonly repository: EmploymentOutcomesRepository) {}

  async listByParticipant(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<any[]> {
    return this.repository.findAllByParticipant(
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
    dto: CreateEmploymentOutcomeDto,
  ): Promise<any> {
    return this.repository.create(tenantId, userId, role, dto);
  }
}

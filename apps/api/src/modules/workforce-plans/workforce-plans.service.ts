import { Injectable, NotFoundException } from '@nestjs/common';
import {
  WorkforcePlansRepository,
  WorkforcePlanRecord,
  PlanTaskRecord,
} from './workforce-plans.repository';

@Injectable()
export class WorkforcePlansService {
  constructor(
    private readonly workforcePlansRepository: WorkforcePlansRepository,
  ) {}

  async listByParticipant(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<WorkforcePlanRecord[]> {
    return this.workforcePlansRepository.findByParticipantId(
      tenantId,
      userId,
      role,
      participantId,
    );
  }

  async getById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<WorkforcePlanRecord & { tasks: PlanTaskRecord[] }> {
    const plan = await this.workforcePlansRepository.findById(
      tenantId,
      userId,
      role,
      id,
    );
    if (!plan) {
      throw new NotFoundException(`Workforce plan with id ${id} not found`);
    }
    return plan;
  }

  async create(
    tenantId: string,
    userId: string,
    role: string,
    dto: {
      participantId: string;
      longTermGoal: string;
      shortTermGoals: Record<string, any>;
    },
  ): Promise<WorkforcePlanRecord> {
    return this.workforcePlansRepository.create(
      tenantId,
      userId,
      role,
      dto,
    );
  }

  async update(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    dto: {
      longTermGoal?: string;
      shortTermGoals?: Record<string, any>;
      status?: string;
    },
  ): Promise<WorkforcePlanRecord> {
    const updated = await this.workforcePlansRepository.update(
      tenantId,
      userId,
      role,
      id,
      dto,
    );
    if (!updated) {
      throw new NotFoundException(`Workforce plan with id ${id} not found`);
    }
    return updated;
  }

  async addTask(
    tenantId: string,
    userId: string,
    role: string,
    planId: string,
    dto: {
      description: string;
      ownerType: string;
      assignedTo: string;
      dueDate?: string;
    },
  ): Promise<PlanTaskRecord> {
    // Validate plan exists
    const plan = await this.workforcePlansRepository.findById(
      tenantId,
      userId,
      role,
      planId,
    );
    if (!plan) {
      throw new NotFoundException(`Workforce plan with id ${planId} not found`);
    }

    return this.workforcePlansRepository.createTask(
      tenantId,
      userId,
      role,
      planId,
      dto,
    );
  }

  async updateTask(
    tenantId: string,
    userId: string,
    role: string,
    taskId: string,
    dto: {
      description?: string;
      ownerType?: string;
      assignedTo?: string;
      dueDate?: string;
      status?: string;
    },
  ): Promise<PlanTaskRecord> {
    const updated = await this.workforcePlansRepository.updateTask(
      tenantId,
      userId,
      role,
      taskId,
      dto,
    );
    if (!updated) {
      throw new NotFoundException(`Plan task with id ${taskId} not found`);
    }
    return updated;
  }

  async completeTask(
    tenantId: string,
    userId: string,
    role: string,
    taskId: string,
  ): Promise<PlanTaskRecord> {
    const completed = await this.workforcePlansRepository.completeTask(
      tenantId,
      userId,
      role,
      taskId,
      userId,
    );
    if (!completed) {
      throw new NotFoundException(`Plan task with id ${taskId} not found`);
    }
    return completed;
  }

  async getParticipantTasks(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<PlanTaskRecord[]> {
    return this.workforcePlansRepository.getParticipantTasks(
      tenantId,
      userId,
      role,
      participantId,
    );
  }
}

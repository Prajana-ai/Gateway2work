import { Injectable, NotFoundException } from '@nestjs/common';
import { TrainingsRepository } from './trainings.repository';
import { CreateTrainingDto, UpdateTrainingDto, TrainingDto } from '@impactforge/shared';

@Injectable()
export class TrainingsService {
  constructor(private readonly trainingsRepository: TrainingsRepository) {}

  async create(
    tenantId: string,
    userId: string,
    role: string,
    data: CreateTrainingDto,
  ): Promise<TrainingDto> {
    return this.trainingsRepository.create(tenantId, userId, role, data);
  }

  async findById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<TrainingDto> {
    const training = await this.trainingsRepository.findById(tenantId, userId, role, id);
    if (!training) {
      throw new NotFoundException(`Training with ID ${id} not found`);
    }
    return training;
  }

  async update(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    data: UpdateTrainingDto,
  ): Promise<TrainingDto> {
    const updated = await this.trainingsRepository.update(tenantId, userId, role, id, data);
    if (!updated) {
      throw new NotFoundException(`Training with ID ${id} not found`);
    }
    return updated;
  }

  async delete(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<void> {
    const deleted = await this.trainingsRepository.delete(tenantId, userId, role, id);
    if (!deleted) {
      throw new NotFoundException(`Training with ID ${id} not found`);
    }
  }

  async findByParticipantId(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<TrainingDto[]> {
    return this.trainingsRepository.findByParticipantId(tenantId, userId, role, participantId);
  }

  async findAll(
    tenantId: string,
    userId: string,
    role: string,
    queryParams: {
      page?: number;
      limit?: number;
      participantId?: string;
      sortBy?: string;
    },
  ): Promise<{ data: TrainingDto[]; total: number }> {
    return this.trainingsRepository.findAll(tenantId, userId, role, queryParams);
  }
}

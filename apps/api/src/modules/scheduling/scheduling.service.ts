import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SchedulingRepository, EventRecord, PaginatedEvents, EventFilters } from './scheduling.repository';

@Injectable()
export class SchedulingService {
  constructor(private readonly schedulingRepository: SchedulingRepository) {}

  async create(
    tenantId: string,
    userId: string,
    role: string,
    dto: {
      title: string;
      description?: string;
      event_type: string;
      participantId?: string;
      staffId?: string;
      rfeId?: string;
      startTime: string;
      endTime: string;
      location?: string;
      isVirtual?: boolean;
      meetingUrl?: string;
      notes?: string;
    },
  ): Promise<EventRecord> {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (end <= start) {
      throw new BadRequestException('End time must be after start time');
    }

    return this.schedulingRepository.create(tenantId, userId, role, {
      title: dto.title,
      description: dto.description,
      event_type: dto.event_type,
      participant_id: dto.participantId,
      staff_id: dto.staffId,
      rfe_id: dto.rfeId,
      start_time: dto.startTime,
      end_time: dto.endTime,
      location: dto.location,
      is_virtual: dto.isVirtual,
      meeting_url: dto.meetingUrl,
      notes: dto.notes,
    });
  }

  async findAll(
    tenantId: string,
    userId: string,
    role: string,
    filters: EventFilters,
  ): Promise<PaginatedEvents> {
    return this.schedulingRepository.findAll(tenantId, userId, role, filters);
  }

  async findById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<EventRecord> {
    const event = await this.schedulingRepository.findById(tenantId, userId, role, id);
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async update(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    dto: Partial<{
      title: string;
      description: string;
      event_type: string;
      participantId: string;
      staffId: string;
      rfeId: string;
      startTime: string;
      endTime: string;
      location: string;
      isVirtual: boolean;
      meetingUrl: string;
      notes: string;
    }>,
  ): Promise<EventRecord> {
    const data: any = { ...dto };
    if (dto.participantId !== undefined) data.participant_id = dto.participantId;
    if (dto.staffId !== undefined) data.staff_id = dto.staffId;
    if (dto.rfeId !== undefined) data.rfe_id = dto.rfeId;
    if (dto.startTime !== undefined) data.start_time = dto.startTime;
    if (dto.endTime !== undefined) data.end_time = dto.endTime;
    if (dto.isVirtual !== undefined) data.is_virtual = dto.isVirtual;
    if (dto.meetingUrl !== undefined) data.meeting_url = dto.meetingUrl;

    const updated = await this.schedulingRepository.update(tenantId, userId, role, id, data);
    if (!updated) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return updated;
  }

  async updateStatus(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    status: string,
  ): Promise<EventRecord> {
    const updated = await this.schedulingRepository.updateStatus(tenantId, userId, role, id, status);
    if (!updated) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return updated;
  }

  async getUpcoming(
    tenantId: string,
    userId: string,
    role: string,
    staffId: string,
    days = 7,
  ): Promise<EventRecord[]> {
    return this.schedulingRepository.getUpcoming(tenantId, userId, role, staffId, days);
  }

  async getParticipantEvents(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<EventRecord[]> {
    return this.schedulingRepository.getParticipantEvents(tenantId, userId, role, participantId);
  }
}

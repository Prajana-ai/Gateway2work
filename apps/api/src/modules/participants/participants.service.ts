import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  ParticipantsRepository,
  ParticipantFilters,
  ParticipantRecord,
  PaginatedParticipants,
  Participant360View,
  DuplicateMatch,
} from './participants.repository';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class ParticipantsService {
  constructor(
    private readonly participantsRepository: ParticipantsRepository,
    private readonly databaseService: DatabaseService,
  ) {}

  async list(
    tenantId: string,
    userId: string,
    role: string,
    filters: ParticipantFilters,
  ): Promise<PaginatedParticipants> {
    return this.participantsRepository.findAll(tenantId, userId, role, filters);
  }

  async getById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<ParticipantRecord> {
    const participant = await this.participantsRepository.findById(
      tenantId,
      userId,
      role,
      id,
    );
    if (!participant) {
      throw new NotFoundException(`Participant with id ${id} not found`);
    }
    return participant;
  }

  async get360View(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<Participant360View> {
    const view = await this.participantsRepository.find360View(
      tenantId,
      userId,
      role,
      id,
    );
    if (!view) {
      throw new NotFoundException(`Participant with id ${id} not found`);
    }
    return view;
  }

  async create(
    tenantId: string,
    userId: string,
    role: string,
    dto: {
      participant_id?: string;
      external_ehr_id?: string;
      demographics: Record<string, any>;
      legal_info?: Record<string, any>;
      socioeconomic?: Record<string, any>;
      consent_42cfr?: boolean;
      consent_expires_at?: string;
      status?: string;
    },
  ): Promise<{ participant: ParticipantRecord; duplicates: DuplicateMatch[] }> {
    if (!dto.demographics) {
      throw new BadRequestException('Participant demographics are required');
    }

    const duplicates = await this.participantsRepository.checkDuplicate(
      tenantId,
      userId,
      role,
      dto.demographics.first_name,
      dto.demographics.last_name,
      dto.demographics.date_of_birth,
    );

    const participant = await this.participantsRepository.create(
      tenantId,
      userId,
      role,
      dto,
    );

    return { participant, duplicates };
  }

  async update(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    dto: Partial<{
      participant_id: string;
      external_ehr_id: string;
      demographics: Record<string, any>;
      legal_info: Record<string, any>;
      socioeconomic: Record<string, any>;
      consent_42cfr: boolean;
      consent_expires_at: string;
      status: string;
    }>,
  ): Promise<ParticipantRecord> {
    // Verify participant exists
    await this.getById(tenantId, userId, role, id);

    const updated = await this.participantsRepository.update(
      tenantId,
      userId,
      role,
      id,
      dto,
    );

    if (!updated) {
      throw new NotFoundException(`Participant with id ${id} not found`);
    }

    // Sync status with referrals if status was updated
    if (dto.status) {
      await this.databaseService.executeInTenantContext(
        tenantId,
        userId,
        role,
        async (client) => {
          // If participant is set to active, completed, or declined, sync the non-finalized referrals
          await client.query(
            `UPDATE protected.referrals 
             SET referral_status = $1, updated_by = $2, updated_at = NOW()
             WHERE participant_id = $3 AND referral_status NOT IN ('completed', 'declined')`,
            [dto.status, userId, id],
          );
        },
      );
    }

    return updated;
  }

  async updateConsent(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    consent42cfr: boolean,
    consentExpiresAt?: string,
  ): Promise<ParticipantRecord> {
    // Verify participant exists
    await this.getById(tenantId, userId, role, id);

    const updated = await this.participantsRepository.update(
      tenantId,
      userId,
      role,
      id,
      {
        consent_42cfr: consent42cfr,
        consent_expires_at: consentExpiresAt,
      },
    );

    if (!updated) {
      throw new NotFoundException(`Participant with id ${id} not found`);
    }

    return updated;
  }

  async provisionLogin(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    customPassword?: string,
  ): Promise<{ success: boolean; email: string; temporaryPassword: string; message: string }> {
    return this.participantsRepository.provisionLogin(
      tenantId,
      userId,
      role,
      id,
      customPassword,
    );
  }
}


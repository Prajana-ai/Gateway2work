import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ReferralsRepository,
  ReferralRow,
  ReferralWithParticipant,
} from './referrals.repository';
import { DatabaseService } from '../../database/database.service';

const VALID_STATUSES = ['pending', 'active', 'completed', 'declined'];

@Injectable()
export class ReferralsService {
  constructor(
    private readonly referralsRepository: ReferralsRepository,
    private readonly databaseService: DatabaseService,
  ) {}

  async list(
    tenantId: string,
    userId: string,
    role: string,
    filters: { status?: string; page: number; limit: number },
  ): Promise<{ items: ReferralRow[]; total: number }> {
    return this.referralsRepository.findAll(tenantId, userId, role, filters);
  }

  async getById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<ReferralWithParticipant> {
    const referral = await this.referralsRepository.findById(
      tenantId,
      userId,
      role,
      id,
    );

    if (!referral) {
      throw new NotFoundException(`Referral with id ${id} not found`);
    }

    return referral;
  }

  async create(
    tenantId: string,
    userId: string,
    role: string,
    dto: {
      participant_id?: string;
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      externalEhrId?: string;
      email?: string;
      phone?: string;
      provider_agency_id?: string;
      provider_agency_name?: string;
      referral_status?: string;
      referralDate?: string;
      referralType?: string;
      notes?: string;
    },
  ): Promise<ReferralRow> {
    let participantId = dto.participant_id;

    // If no participant_id is provided, try to find or create the participant
    if (!participantId) {
      if (!dto.firstName || !dto.lastName || !dto.dateOfBirth) {
        throw new BadRequestException(
          'Missing required demographic data for referral-first workflow (firstName, lastName, dateOfBirth)',
        );
      }

      participantId = await this.databaseService.executeInTenantContext(
        tenantId,
        userId,
        role,
        async (dbClient) => {
          // 1. Try to find by external EHR ID if provided
          if (dto.externalEhrId) {
            const ehrResult = await dbClient.query(
              'SELECT id FROM protected.participants WHERE external_ehr_id = $1',
              [dto.externalEhrId],
            );
            if (ehrResult.rows.length > 0) {
              return ehrResult.rows[0].id;
            }
          }

          // 2. Fuzzy match by name and DOB
          const fuzzyResult = await dbClient.query(
            `SELECT id FROM protected.participants 
             WHERE (similarity(demographics->>'first_name', $1) > 0.4 OR similarity(demographics->>'last_name', $2) > 0.4)
               AND demographics->>'date_of_birth' = $3
             ORDER BY similarity(demographics->>'first_name', $1) + similarity(demographics->>'last_name', $2) DESC
             LIMIT 1`,
            [dto.firstName, dto.lastName, dto.dateOfBirth],
          );
          if (fuzzyResult.rows.length > 0) {
            return fuzzyResult.rows[0].id;
          }

          // 3. Not found - Create a skeleton participant
          const demographics = {
            first_name: dto.firstName,
            last_name: dto.lastName,
            date_of_birth: dto.dateOfBirth,
            email: dto.email || null,
            phone: dto.phone || null,
          };

          const year = new Date().getFullYear().toString().slice(-2);
          const random = Math.floor(1000 + Math.random() * 9000);
          const generatedParticipantId = `REF-${year}-${random}`;

          const createResult = await dbClient.query(
            `INSERT INTO protected.participants 
             (tenant_id, participant_id, external_ehr_id, demographics, status, created_by, updated_by)
             VALUES ($1, $2, $3, $4, 'pending', $5, $5)
             RETURNING id`,
            [
              tenantId,
              generatedParticipantId,
              dto.externalEhrId || null,
              JSON.stringify(demographics),
              userId,
            ],
          );
          return createResult.rows[0].id;
        },
      );
    } else {
      // Validate provided participant_id exists
      const participantExists = await this.databaseService.executeInTenantContext(
        tenantId,
        userId,
        role,
        async (client) => {
          const result = await client.query(
            'SELECT id FROM protected.participants WHERE id = $1',
            [participantId],
          );
          return result.rows.length > 0;
        },
      );

      if (!participantExists) {
        throw new BadRequestException(`Participant with id ${participantId} not found`);
      }
    }

    return this.referralsRepository.create(tenantId, userId, role, {
      participant_id: participantId!,
      provider_agency_id: dto.provider_agency_id,
      provider_agency_name: dto.provider_agency_name,
      referral_status: dto.referral_status || 'pending',
      referral_date: dto.referralDate,
      referral_type: dto.referralType,
      notes: dto.notes,
    });
  }

  async updateStatus(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    status: string,
  ): Promise<ReferralRow> {
    const statusLower = status.toLowerCase();
    if (!VALID_STATUSES.includes(statusLower)) {
      throw new BadRequestException(`Invalid referral status: ${status}`);
    }

    // Verify the referral exists before updating
    const existing = await this.referralsRepository.findById(
      tenantId,
      userId,
      role,
      id,
    );
    if (!existing) {
      throw new NotFoundException(`Referral with id ${id} not found`);
    }

    const updated = await this.referralsRepository.updateStatus(
      tenantId,
      userId,
      role,
      id,
      statusLower,
    );

    if (!updated) {
       throw new NotFoundException(`Failed to update referral with id ${id}`);
    }

    // Sync status with participant
    await this.databaseService.executeInTenantContext(
      tenantId,
      userId,
      role,
      async (client) => {
        await client.query(
          `UPDATE protected.participants 
           SET status = $1, updated_by = $2, updated_at = NOW()
           WHERE id = $3`,
          [statusLower, userId, updated.participant_id],
        );
      },
    );

    return updated;
  }
}

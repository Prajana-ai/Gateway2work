import { Injectable } from '@nestjs/common';
import { TenantAwareRepository } from '../../common/database/tenant-aware.repository';
import { DatabaseService } from '../../database/database.service';

export interface ReferralRow {
  id: string;
  tenant_id: string;
  participant_id: string;
  provider_agency_id: string;
  provider_agency_name: string;
  referral_status: string;
  referral_date: string;
  referral_type: string;
  notes: string;
  ingested_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface ReferralWithParticipant extends ReferralRow {
  participant_first_name: string;
  participant_last_name: string;
  participant_date_of_birth: string;
  participant_gender: string;
}

@Injectable()
export class ReferralsRepository extends TenantAwareRepository {
  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  async findAll(
    tenantId: string,
    userId: string,
    role: string,
    filters: { status?: string; page: number; limit: number },
  ): Promise<{ items: ReferralRow[]; total: number }> {
    return this.execute(tenantId, userId, role, async (participant) => {
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (filters.status) {
        conditions.push(`r.referral_status = $${paramIndex}`);
        params.push(filters.status);
        paramIndex++;
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countResult = await participant.query(
        `SELECT COUNT(*) AS total FROM protected.referrals r ${whereClause}`,
        params,
      );
      const total = parseInt(countResult.rows[0].total, 10);

      const offset = (filters.page - 1) * filters.limit;
      const dataParams = [...params, filters.limit, offset];

      const dataResult = await participant.query(
        `SELECT r.id, r.tenant_id, r.participant_id, r.provider_agency_id, r.provider_agency_name,
                r.referral_status, r.referral_date, r.referral_type, r.notes, 
                r.ingested_at AS "createdAt",
                r.updated_at AS "updatedAt",
                r.created_by, r.updated_by,
                TRIM(concat_ws(' ', p.demographics->>'first_name', p.demographics->>'last_name')) AS "participantName",
                COALESCE(e.referral_source, r.provider_agency_name) AS referral_source
         FROM protected.referrals r
         LEFT JOIN protected.participants p ON p.id = r.participant_id
         LEFT JOIN LATERAL (
            SELECT referral_source 
            FROM protected.enrollments 
            WHERE referral_id = r.id 
            LIMIT 1
         ) e ON true
         ${whereClause}
         ORDER BY r.ingested_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        dataParams,
      );

      return { items: dataResult.rows, total };
    });
  }

  async findById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<ReferralWithParticipant | null> {
    return this.execute(tenantId, userId, role, async (participant) => {
      const result = await participant.query(
        `SELECT r.id, r.tenant_id, r.participant_id, r.provider_agency_id, r.provider_agency_name,
                r.referral_status, r.referral_date, r.referral_type, r.notes, 
                r.ingested_at AS "createdAt",
                r.updated_at AS "updatedAt",
                r.created_by, r.updated_by,
                TRIM(concat_ws(' ', p.demographics->>'first_name', p.demographics->>'last_name')) AS "participantName",
                p.demographics->>'first_name' AS participant_first_name,
                p.demographics->>'last_name' AS participant_last_name,
                p.demographics->>'date_of_birth' AS participant_date_of_birth,
                p.demographics->>'gender' AS participant_gender,
                COALESCE(e.referral_source, r.provider_agency_name) AS referral_source
         FROM protected.referrals r
         LEFT JOIN protected.participants p ON p.id = r.participant_id
         LEFT JOIN LATERAL (
            SELECT referral_source 
            FROM protected.enrollments 
            WHERE referral_id = r.id 
            LIMIT 1
         ) e ON true
         WHERE r.id = $1`,
        [id],
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  async create(
    tenantId: string,
    userId: string,
    role: string,
    data: {
      participant_id: string;
      provider_agency_id?: string;
      provider_agency_name?: string;
      referral_status: string;
      referral_date?: string;
      referral_type?: string;
      notes?: string;
    },
  ): Promise<ReferralRow> {
    return this.execute(tenantId, userId, role, async (participant) => {
      const result = await participant.query(
        `INSERT INTO protected.referrals
            (tenant_id, participant_id, provider_agency_id, provider_agency_name, referral_status, referral_date, referral_type, notes, created_by, updated_by)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
          RETURNING *`,
        [
          tenantId,
          data.participant_id,
          data.provider_agency_id || null,
          data.provider_agency_name || null,
          data.referral_status,
          data.referral_date || new Date().toISOString(),
          data.referral_type || null,
          data.notes || null,
          userId,
        ],
      );

      return result.rows[0];
    });
  }
  async updateStatus(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    status: string,
  ): Promise<ReferralRow | null> {
    return this.execute(tenantId, userId, role, async (participant) => {
      const result = await participant.query(
        `UPDATE protected.referrals
         SET referral_status = $1, updated_by = $2
         WHERE id = $3
         RETURNING *`,
        [status, userId, id],
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }
}

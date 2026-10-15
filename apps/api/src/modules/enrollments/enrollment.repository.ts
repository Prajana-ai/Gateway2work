import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { TenantAwareRepository } from '../../common/database/tenant-aware.repository';
import { CreateEnrollmentDto, UpdateEnrollmentDto } from '@impactforge/shared';

@Injectable()
export class EnrollmentRepository extends TenantAwareRepository {
  constructor(protected readonly databaseService: DatabaseService) {
    super(databaseService);
  }

  async create(
    tenantId: string,
    userId: string,
    role: string,
    data: CreateEnrollmentDto,
  ): Promise<{ id: string }> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const query = `
        INSERT INTO protected.enrollments (
          tenant_id,
          participant_id,
          referral_id,
          program_enrolled_in,
          enrollment_date,
          intake_completion_date,
          eligibility_determination,
          eligibility_date,
          reason_not_eligible,
          cohort_number,
          funding_source_tied_to_participant,
          recruitment_source,
          assessment_date,
          ips_participant_established_date,
          case_management_established_participant_date,
          created_by,
          updated_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        ) RETURNING id
      `;
      const values = [
        tenantId,
        data.participant_id,
        data.referral_id,
        data.program_enrolled_in,
        data.enrollment_date,
        data.intake_completion_date,
        data.eligibility_determination,
        data.eligibility_date,
        data.reason_not_eligible,
        data.cohort_number,
        data.funding_source_tied_to_participant,
        data.recruitment_source,
        data.assessment_date,
        data.ips_participant_established_date,
        data.case_management_established_participant_date,
        userId,
        userId,
      ];
      const result = await client.query(query, values);
      return result.rows[0];
    });
  }

  async findById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<any | null> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const query = `
        SELECT * FROM protected.enrollments WHERE id = $1 AND tenant_id = $2
      `;
      const result = await client.query(query, [id, tenantId]);
      return result.rows[0] || null;
    });
  }

  async update(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    data: UpdateEnrollmentDto,
  ): Promise<any | null> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const updateFields = Object.entries(data).filter(([_, value]) => value !== undefined && value !== null);

      if (updateFields.length === 0) {
        return this.findById(tenantId, userId, role, id);
      }

      const setClausesWithParams: string[] = [];
      const queryParams: any[] = [id, tenantId];

      updateFields.forEach(([key, value]) => {
        if (key !== 'id' && key !== 'tenant_id') {
          setClausesWithParams.push(`"${key}" = $${queryParams.length + 1}`);
          queryParams.push(value);
        }
      });

      const hasUpdatedAt = updateFields.some(([key]) => key === 'updated_at');
      if (!hasUpdatedAt) {
        setClausesWithParams.push(`"updated_at" = NOW()`);
      }
      
      const hasUpdatedBy = updateFields.some(([key]) => key === 'updated_by');
      if (!hasUpdatedBy) {
        setClausesWithParams.push(`"updated_by" = $${queryParams.length + 1}`);
        queryParams.push(userId);
      }

      const finalUpdateQuery = `
        UPDATE protected.enrollments
        SET ${setClausesWithParams.join(', ')}
        WHERE id = $1 AND tenant_id = $2
        RETURNING *
      `;

      const result = await client.query(finalUpdateQuery, queryParams);
      return result.rows[0] || null;
    });
  }

  async delete(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<boolean> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        'DELETE FROM protected.enrollments WHERE id = $1 AND tenant_id = $2',
        [id, tenantId],
      );
      return (result.rowCount ?? 0) > 0;
    });
  }

  async findByParticipantId(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<any[]> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const query = `
        SELECT * FROM protected.enrollments WHERE participant_id = $1 AND tenant_id = $2 ORDER BY enrollment_date DESC
      `;
      const result = await client.query(query, [participantId, tenantId]);
      return result.rows;
    });
  }

  async findByReferralId(
    tenantId: string,
    userId: string,
    role: string,
    referralId: string,
  ): Promise<any[]> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const query = `
        SELECT * FROM protected.enrollments WHERE referral_id = $1 AND tenant_id = $2 ORDER BY enrollment_date DESC
      `;
      const result = await client.query(query, [referralId, tenantId]);
      return result.rows;
    });
  }

  async findAll(
    tenantId: string,
    userId: string,
    role: string,
    // This queryParams object should match what the service/controller expects from the client
    queryParams: {
      page?: number;
      limit?: number;
      participantId?: string;
      referralId?: string;
      // Add other filters here, e.g., program_enrolled_in, enrollment_date_range
      sortBy?: string; // e.g., 'enrollment_date:DESC'
    },
  ): Promise<{ data: any[]; total: number }> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const {
        page = 1,
        limit = 50,
        participantId,
        referralId,
        sortBy,
      } = queryParams;

      const offset = (page - 1) * limit;
      const wheres: string[] = ['tenant_id = $1'];
      const queryParamsValues: any[] = [tenantId];
      let paramIndex = 2; // Start from $2 for conditions after tenant_id

      if (participantId) {
        wheres.push(`participant_id = $${paramIndex++}`);
        queryParamsValues.push(participantId);
      }
      if (referralId) {
        wheres.push(`referral_id = $${paramIndex++}`);
        queryParamsValues.push(referralId);
      }

      // Add other filters here
      // e.g., if (queryParams.program_enrolled_in) { wheres.push(`program_enrolled_in = $${paramIndex++}`); queryParamsValues.push(queryParams.program_enrolled_in); }

      const orderByClause = sortBy
        ? sortBy.split(':').map(part => `"${part.trim()}"`).join(' ')
        : '"enrollment_date" DESC'; // Default sort order

      const countQuery = `SELECT COUNT(*) AS total FROM protected.enrollments WHERE ${wheres.join(' AND ')}`;
      const countResult = await client.query(countQuery, queryParamsValues);
      const total = parseInt(countResult.rows[0].total, 10);

      const dataQuery = `
        SELECT 
          id,
          participant_id,
          referral_id,
          program_enrolled_in,
          enrollment_date,
          intake_completion_date,
          eligibility_determination,
          eligibility_date,
          reason_not_eligible,
          cohort_number,
          funding_source_tied_to_participant,
          recruitment_source,
          assessment_date,
          ips_participant_established_date,
          case_management_established_participant_date
        FROM protected.enrollments
        WHERE ${wheres.join(' AND ')}
        ORDER BY ${orderByClause}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      queryParamsValues.push(limit);
      queryParamsValues.push(offset);

      const result = await client.query(dataQuery, queryParamsValues);
      return { data: result.rows, total };
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { TenantAwareRepository } from '../../common/database/tenant-aware.repository';
import { CreateTrainingDto, UpdateTrainingDto, TrainingDto } from '@impactforge/shared';

@Injectable()
export class TrainingsRepository extends TenantAwareRepository {
  constructor(protected readonly databaseService: DatabaseService) {
    super(databaseService);
  }

  async create(
    tenantId: string,
    userId: string,
    role: string,
    data: CreateTrainingDto,
  ): Promise<TrainingDto> {
    return this.execute(tenantId, userId, role, async (dbClient: PoolClient) => {
      const query = `
        INSERT INTO protected.trainings (
          tenant_id,
          participant_id,
          program_name,
          provider,
          start_date,
          end_date,
          is_completed,
          completion_date,
          credential_earned,
          credential_type,
          license_earned,
          apprenticeship_participation,
          internship_participation,
          wbl_participation,
          ojt_participation,
          total_hours,
          stipend_provided,
          outcome,
          created_by,
          updated_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $19
        ) RETURNING *
      `;
      const values = [
        tenantId,
        data.participant_id,
        data.program_name,
        data.provider,
        data.start_date,
        data.end_date,
        data.is_completed,
        data.completion_date,
        data.credential_earned,
        data.credential_type,
        data.license_earned,
        data.apprenticeship_participation,
        data.internship_participation,
        data.wbl_participation,
        data.ojt_participation,
        data.total_hours,
        data.stipend_provided,
        data.outcome,
        userId,
      ];
      const result = await dbClient.query(query, values);
      return result.rows[0];
    });
  }

  async findById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<TrainingDto | null> {
    return this.execute(tenantId, userId, role, async (dbClient: PoolClient) => {
      const query = `
        SELECT * FROM protected.trainings WHERE id = $1 AND tenant_id = $2
      `;
      const result = await dbClient.query(query, [id, tenantId]);
      return result.rows[0] || null;
    });
  }

  async update(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    data: UpdateTrainingDto,
  ): Promise<TrainingDto | null> {
    return this.execute(tenantId, userId, role, async (dbClient: PoolClient) => {
      const updateFields = Object.entries(data).filter(([_, value]) => value !== undefined);

      if (updateFields.length === 0) {
        return this.findById(tenantId, userId, role, id);
      }

      const setClauses: string[] = [];
      const queryParams: any[] = [id, tenantId];

      updateFields.forEach(([key, value]) => {
        setClauses.push(`"${key}" = $${queryParams.length + 1}`);
        queryParams.push(value);
      });

      setClauses.push(`"updated_at" = NOW()`);
      setClauses.push(`"updated_by" = $${queryParams.length + 1}`);
      queryParams.push(userId);

      const query = `
        UPDATE protected.trainings
        SET ${setClauses.join(', ')}
        WHERE id = $1 AND tenant_id = $2
        RETURNING *
      `;

      const result = await dbClient.query(query, queryParams);
      return result.rows[0] || null;
    });
  }

  async delete(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<boolean> {
    return this.execute(tenantId, userId, role, async (dbClient: PoolClient) => {
      const result = await dbClient.query(
        'DELETE FROM protected.trainings WHERE id = $1 AND tenant_id = $2',
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
  ): Promise<TrainingDto[]> {
    return this.execute(tenantId, userId, role, async (dbClient: PoolClient) => {
      const query = `
        SELECT * FROM protected.trainings WHERE participant_id = $1 AND tenant_id = $2 ORDER BY start_date DESC
      `;
      const result = await dbClient.query(query, [participantId, tenantId]);
      return result.rows;
    });
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
    return this.execute(tenantId, userId, role, async (dbClient: PoolClient) => {
      const {
        page = 1,
        limit = 50,
        participantId,
        sortBy = 'start_date:DESC',
      } = queryParams;

      const offset = (page - 1) * limit;
      const wheres: string[] = ['tenant_id = $1'];
      const values: any[] = [tenantId];
      let paramIndex = 2;

      if (participantId) {
        wheres.push(`participant_id = $${paramIndex++}`);
        values.push(participantId);
      }

      const orderBy = sortBy.split(':').map(p => `"${p.trim()}"`).join(' ');

      const countQuery = `SELECT COUNT(*) AS total FROM protected.trainings WHERE ${wheres.join(' AND ')}`;
      const countResult = await dbClient.query(countQuery, values);
      const total = parseInt(countResult.rows[0].total, 10);

      const dataQuery = `
        SELECT * FROM protected.trainings
        WHERE ${wheres.join(' AND ')}
        ORDER BY ${orderBy}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      values.push(limit, offset);

      const result = await dbClient.query(dataQuery, values);
      return { data: result.rows, total };
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { TenantAwareRepository } from '../../common/database/tenant-aware.repository';
import { DatabaseService } from '../../database/database.service';
import { CreateFollowUpDto, UpdateFollowUpDto } from '@impactforge/shared';

export interface FollowUpRow {
  id: string;
  tenant_id: string;
  participant_id: string;
  due_date: string;
  completed_date: string | null;
  method: string | null;
  status: string;
  outcome_metrics: Record<string, any>;
  employment_at_follow_up: boolean | null;
  wage_at_follow_up: number | null;
  education_status: string | null;
  housing_status: string | null;
  continued_service_needs: string | null;
  long_term_goal_progress: string | null;
  notes: string | null;
  created_at: string;
}

@Injectable()
export class FollowUpsRepository extends TenantAwareRepository {
  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  async findAllByParticipant(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<FollowUpRow[]> {
    return this.execute(tenantId, userId, role, async (dbClient: PoolClient) => {
      const result = await dbClient.query(
        `SELECT * FROM protected.follow_ups
         WHERE participant_id = $1
         ORDER BY due_date DESC`,
        [participantId],
      );
      return result.rows;
    });
  }

  async create(
    tenantId: string,
    userId: string,
    role: string,
    dto: CreateFollowUpDto,
  ): Promise<FollowUpRow> {
    return this.execute(tenantId, userId, role, async (dbClient: PoolClient) => {
      const result = await dbClient.query(
        `INSERT INTO protected.follow_ups (
          tenant_id, participant_id, due_date, completed_date, method, status,
          outcome_metrics, employment_at_follow_up, wage_at_follow_up, 
          education_status, housing_status, continued_service_needs, 
          long_term_goal_progress, notes, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $15)
        RETURNING *`,
        [
          tenantId,
          dto.participant_id,
          dto.due_date,
          dto.completed_date || null,
          dto.method || null,
          dto.status,
          JSON.stringify(dto.outcome_metrics),
          dto.employment_at_follow_up ?? null,
          dto.wage_at_follow_up ?? null,
          dto.education_status || null,
          dto.housing_status || null,
          dto.continued_service_needs || null,
          dto.long_term_goal_progress || null,
          dto.notes || null,
          userId,
        ],
      );
      return result.rows[0];
    });
  }
}

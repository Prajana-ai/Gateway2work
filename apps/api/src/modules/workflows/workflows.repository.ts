import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { TenantAwareRepository } from '../../common/database/tenant-aware.repository';
import { DatabaseService } from '../../database/database.service';

export interface WorkflowStageCondition {
  field: string;
  operator: 'eq' | 'gte' | 'lte' | 'gt' | 'lt';
  value: any;
}

export interface WorkflowAutoTask {
  description: string;
  owner_type: 'staff' | 'participant';
  due_days: number;
}

export interface WorkflowStage {
  name: string;
  order: number;
  type:
    | 'referral_intake'
    | 'assessment'
    | 'workforce_plan'
    | 'employer_match'
    | 'follow_up';
  conditions: WorkflowStageCondition[];
  auto_tasks: WorkflowAutoTask[];
  next_stage_trigger: 'auto' | 'manual';
}

export interface WorkflowTemplateRecord {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  stages: WorkflowStage[];
  is_active: boolean;
  created_at: string;
}

export interface WorkflowInstanceRecord {
  id: string;
  tenant_id: string;
  template_id: string;
  participant_id: string;
  current_stage: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  stage_data: Record<string, any>;
  started_at: string;
  completed_at: string | null;
  created_by: string | null;
}

export interface WorkflowInstanceWithProgress extends WorkflowInstanceRecord {
  template_name: string;
  stages: WorkflowStage[];
  current_stage_index: number;
  total_stages: number;
}

@Injectable()
export class WorkflowsRepository extends TenantAwareRepository {
  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  // ── Template CRUD ──────────────────────────────────────────────────

  async findAllTemplates(
    tenantId: string,
    userId: string,
    role: string,
  ): Promise<WorkflowTemplateRecord[]> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT * FROM application.workflow_templates
         WHERE is_active = true
         ORDER BY created_at DESC`,
      );
      return result.rows;
    });
  }

  async findTemplateById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<WorkflowTemplateRecord | null> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT * FROM application.workflow_templates WHERE id = $1`,
        [id],
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  async createTemplate(
    tenantId: string,
    userId: string,
    role: string,
    data: {
      name: string;
      description?: string;
      stages: WorkflowStage[];
    },
  ): Promise<WorkflowTemplateRecord> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `INSERT INTO application.workflow_templates
           (tenant_id, name, description, stages)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          tenantId,
          data.name,
          data.description || null,
          JSON.stringify(data.stages),
        ],
      );
      return result.rows[0];
    });
  }

  async updateTemplate(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    data: Partial<{
      name: string;
      description: string;
      stages: WorkflowStage[];
      is_active: boolean;
    }>,
  ): Promise<WorkflowTemplateRecord | null> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const setClauses: string[] = [];
      const params: any[] = [];

      if (data.name !== undefined) {
        params.push(data.name);
        setClauses.push(`name = $${params.length}`);
      }
      if (data.description !== undefined) {
        params.push(data.description);
        setClauses.push(`description = $${params.length}`);
      }
      if (data.stages !== undefined) {
        params.push(JSON.stringify(data.stages));
        setClauses.push(`stages = $${params.length}`);
      }
      if (data.is_active !== undefined) {
        params.push(data.is_active);
        setClauses.push(`is_active = $${params.length}`);
      }

      if (setClauses.length === 0) {
        return this.findTemplateById(tenantId, userId, role, id);
      }

      params.push(id);
      const idIdx = params.length;

      const sql = `
        UPDATE application.workflow_templates
        SET ${setClauses.join(', ')}
        WHERE id = $${idIdx}
        RETURNING *
      `;

      const result = await client.query(sql, params);
      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  // ── Instance CRUD ──────────────────────────────────────────────────

  async findInstancesByParticipant(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<WorkflowInstanceRecord[]> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT * FROM application.workflow_instances
         WHERE participant_id = $1
         ORDER BY started_at DESC`,
        [participantId],
      );
      return result.rows;
    });
  }

  async findInstanceById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<WorkflowInstanceRecord | null> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT * FROM application.workflow_instances WHERE id = $1`,
        [id],
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  async createInstance(
    tenantId: string,
    userId: string,
    role: string,
    data: {
      template_id: string;
      participant_id: string;
      current_stage: string;
      stage_data?: Record<string, any>;
    },
  ): Promise<WorkflowInstanceRecord> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `INSERT INTO application.workflow_instances
           template_id, participant_id, current_stage, stage_data, created_by
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
           [
           tenantId,
           data.template_id,
           data.participant_id,
           data.current_stage,
           JSON.stringify(data.stage_data || {}),
           userId,
           ],
      );
      return result.rows[0];
    });
  }

  async advanceStage(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    nextStage: string,
    stageData: Record<string, any>,
  ): Promise<WorkflowInstanceRecord | null> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `UPDATE application.workflow_instances
         SET current_stage = $1,
             stage_data = stage_data || $2::jsonb
         WHERE id = $3
         RETURNING *`,
        [nextStage, JSON.stringify(stageData), id],
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  async updateStatus(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    status: 'active' | 'paused' | 'completed' | 'cancelled',
  ): Promise<WorkflowInstanceRecord | null> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const completedAt = status === 'completed' ? 'NOW()' : 'NULL';
      const result = await client.query(
        `UPDATE application.workflow_instances
         SET status = $1,
             completed_at = ${completedAt}
         WHERE id = $2
         RETURNING *`,
        [status, id],
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  async getInstanceWithProgress(
    tenantId: string,
    userId: string,
    role: string,
    instanceId: string,
  ): Promise<WorkflowInstanceWithProgress | null> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT
           wi.*,
           wt.name AS template_name,
           wt.stages AS stages
         FROM application.workflow_instances wi
         JOIN application.workflow_templates wt ON wt.id = wi.template_id
         WHERE wi.id = $1`,
        [instanceId],
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      const stages: WorkflowStage[] =
        typeof row.stages === 'string' ? JSON.parse(row.stages) : row.stages;
      const currentStageIndex = stages.findIndex(
        (s) => s.name === row.current_stage,
      );

      return {
        ...row,
        stages,
        current_stage_index: currentStageIndex,
        total_stages: stages.length,
      };
    });
  }

  // ── Participant data queries for condition evaluation ───────────────────

  async countParticipantAssessments(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<number> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT COUNT(*) AS count
         FROM protected.assessments
         WHERE participant_id = $1 AND completed_at IS NOT NULL`,
        [participantId],
      );
      return parseInt(result.rows[0].count, 10);
    });
  }

  async hasWorkforcePlan(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<boolean> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT 1 FROM application.workforce_plans
         WHERE participant_id = $1 AND status = 'active'
         LIMIT 1`,
        [participantId],
      );
      return result.rows.length > 0;
    });
  }

  async countEmployerMatches(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<number> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT COUNT(*) AS count
         FROM application.participant_employer_matches
         WHERE participant_id = $1`,
        [participantId],
      );
      return parseInt(result.rows[0].count, 10);
    });
  }

  async hasReferral(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<boolean> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT 1 FROM protected.referrals
         WHERE participant_id = $1
         LIMIT 1`,
        [participantId],
      );
      return result.rows.length > 0;
    });
  }
}

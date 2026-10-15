import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { TenantAwareRepository } from '../../common/database/tenant-aware.repository';
import { DatabaseService } from '../../database/database.service';

export interface WorkforcePlanRecord {
  id: string;
  tenant_id: string;
  participant_id: string;
  long_term_goal: string;
  short_term_goals: Record<string, any>;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface PlanTaskRecord {
  id: string;
  plan_id: string;
  tenant_id: string;
  description: string;
  owner_type: string;
  assigned_to: string;
  due_date: string | null;
  status: string;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
}

@Injectable()
export class WorkforcePlansRepository extends TenantAwareRepository {
  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  async findByParticipantId(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<WorkforcePlanRecord[]> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT id, tenant_id, participant_id, long_term_goal, short_term_goals,
                status, created_at, updated_at, created_by, updated_by
         FROM application.workforce_plans
         WHERE participant_id = $1
         ORDER BY created_at DESC`,
        [participantId],
      );
      return result.rows;
    });
  }

  async findById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<(WorkforcePlanRecord & { tasks: PlanTaskRecord[] }) | null> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const planResult = await client.query(
        `SELECT id, tenant_id, participant_id, long_term_goal, short_term_goals,
                status, created_at, updated_at, created_by, updated_by
         FROM application.workforce_plans
         WHERE id = $1`,
        [id],
      );

      if (planResult.rows.length === 0) {
        return null;
      }

      const plan = planResult.rows[0];

      const tasksResult = await client.query(
        `SELECT id, plan_id, tenant_id, description, owner_type,
                assigned_to, due_date, status, completed_at, completed_by, created_at
         FROM application.plan_tasks
         WHERE plan_id = $1
         ORDER BY created_at ASC`,
        [id],
      );

      return { ...plan, tasks: tasksResult.rows };
    });
  }

  async create(
    tenantId: string,
    userId: string,
    role: string,
    data: {
      participantId: string;
      longTermGoal: string;
      shortTermGoals: Record<string, any>;
    },
  ): Promise<WorkforcePlanRecord> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `INSERT INTO application.workforce_plans (
          tenant_id, participant_id, long_term_goal, short_term_goals,
          status, created_by, updated_by
        ) VALUES ($1, $2, $3, $4, 'draft', $5, $5)
        RETURNING *`,
        [
          tenantId,
          data.participantId,
          data.longTermGoal,
          JSON.stringify(data.shortTermGoals),
          userId,
        ],
      );
      return result.rows[0];
    });
  }

  async update(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    data: {
      longTermGoal?: string;
      shortTermGoals?: Record<string, any>;
      status?: string;
    },
  ): Promise<WorkforcePlanRecord | null> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.longTermGoal !== undefined) {
        setClauses.push(`long_term_goal = $${paramIndex++}`);
        values.push(data.longTermGoal);
      }
      if (data.shortTermGoals !== undefined) {
        setClauses.push(`short_term_goals = $${paramIndex++}`);
        values.push(JSON.stringify(data.shortTermGoals));
      }
      if (data.status !== undefined) {
        setClauses.push(`status = $${paramIndex++}`);
        values.push(data.status);
      }

      setClauses.push(`updated_by = $${paramIndex++}`);
      values.push(userId);
      setClauses.push(`updated_at = NOW()`);

      values.push(id);

      const result = await client.query(
        `UPDATE application.workforce_plans
         SET ${setClauses.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        values,
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  async createTask(
    tenantId: string,
    userId: string,
    role: string,
    planId: string,
    data: {
      description: string;
      ownerType: string;
      assignedTo: string;
      dueDate?: string;
    },
  ): Promise<PlanTaskRecord> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `INSERT INTO application.plan_tasks (
          plan_id, tenant_id, description, owner_type,
          assigned_to, due_date, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'todo')
        RETURNING *`,
        [
          planId,
          tenantId,
          data.description,
          data.ownerType,
          data.assignedTo,
          data.dueDate || null,
        ],
      );
      return result.rows[0];
    });
  }

  async updateTask(
    tenantId: string,
    userId: string,
    role: string,
    taskId: string,
    data: {
      description?: string;
      ownerType?: string;
      assignedTo?: string;
      dueDate?: string;
      status?: string;
    },
  ): Promise<PlanTaskRecord | null> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.description !== undefined) {
        setClauses.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }
      if (data.ownerType !== undefined) {
        setClauses.push(`owner_type = $${paramIndex++}`);
        values.push(data.ownerType);
      }
      if (data.assignedTo !== undefined) {
        setClauses.push(`assigned_to = $${paramIndex++}`);
        values.push(data.assignedTo);
      }
      if (data.dueDate !== undefined) {
        setClauses.push(`due_date = $${paramIndex++}`);
        values.push(data.dueDate);
      }
      if (data.status !== undefined) {
        setClauses.push(`status = $${paramIndex++}`);
        values.push(data.status);
      }

      if (setClauses.length === 0) {
        // Nothing to update, fetch current
        const current = await client.query(
          `SELECT * FROM application.plan_tasks WHERE id = $1`,
          [taskId],
        );
        return current.rows.length > 0 ? current.rows[0] : null;
      }

      values.push(taskId);

      const result = await client.query(
        `UPDATE application.plan_tasks
         SET ${setClauses.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        values,
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  async completeTask(
    tenantId: string,
    userId: string,
    role: string,
    taskId: string,
    completedBy: string,
  ): Promise<PlanTaskRecord | null> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `UPDATE application.plan_tasks
         SET status = 'completed', completed_at = NOW(), completed_by = $1
         WHERE id = $2
         RETURNING *`,
        [completedBy, taskId],
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  async getTasksByPlan(
    tenantId: string,
    userId: string,
    role: string,
    planId: string,
  ): Promise<PlanTaskRecord[]> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT id, plan_id, tenant_id, description, owner_type,
                assigned_to, due_date, status, completed_at, completed_by, created_at
         FROM application.plan_tasks
         WHERE plan_id = $1
         ORDER BY created_at ASC`,
        [planId],
      );
      return result.rows;
    });
  }

  async getParticipantTasks(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<PlanTaskRecord[]> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT pt.id, pt.plan_id, pt.tenant_id, pt.description, pt.owner_type,
                pt.assigned_to, pt.due_date, pt.status, pt.completed_at,
                pt.completed_by, pt.created_at
         FROM application.plan_tasks pt
         INNER JOIN application.workforce_plans wp ON wp.id = pt.plan_id
         WHERE wp.participant_id = $1
         ORDER BY pt.due_date ASC NULLS LAST, pt.created_at ASC`,
        [participantId],
      );
      return result.rows;
    });
  }
}

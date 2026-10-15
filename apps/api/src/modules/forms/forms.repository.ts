import { Injectable } from '@nestjs/common';
import { TenantAwareRepository } from '../../common/database/tenant-aware.repository';
import { DatabaseService } from '../../database/database.service';

export interface FormTemplateRow {
  id: string;
  tenant_id: string;
  name: string;
  vertical: string;
  assessment_type: string;
  json_schema: Record<string, any>;
  ui_schema: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class FormsRepository extends TenantAwareRepository {
  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  async findAll(
    tenantId: string,
    userId: string,
    role: string,
    filters: { vertical?: string; assessmentType?: string; isActive?: boolean },
  ): Promise<FormTemplateRow[]> {
    return this.execute(tenantId, userId, role, async (dbClient) => {
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (filters.vertical) {
        conditions.push(`ft.vertical = $${paramIndex}`);
        params.push(filters.vertical);
        paramIndex++;
      }

      if (filters.assessmentType) {
        conditions.push(`ft.assessment_type = $${paramIndex}`);
        params.push(filters.assessmentType);
        paramIndex++;
      }

      if (filters.isActive !== undefined) {
        conditions.push(`ft.is_active = $${paramIndex}`);
        params.push(filters.isActive);
        paramIndex++;
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const result = await dbClient.query(
        `SELECT ft.id, ft.tenant_id, ft.name, ft.vertical, ft.assessment_type,
                ft.json_schema, ft.ui_schema, ft.is_active,
                ft.created_at, ft.updated_at
         FROM application.form_templates ft
         ${whereClause}
         ORDER BY ft.name ASC`,
        params,
      );

      return result.rows;
    });
  }

  async findById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<FormTemplateRow | null> {
    return this.execute(tenantId, userId, role, async (dbClient) => {
      const result = await dbClient.query(
        `SELECT ft.id, ft.tenant_id, ft.name, ft.vertical, ft.assessment_type,
                ft.json_schema, ft.ui_schema, ft.is_active,
                ft.created_at, ft.updated_at
         FROM application.form_templates ft
         WHERE ft.id = $1`,
        [id],
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  async findByAssessmentType(
    tenantId: string,
    userId: string,
    role: string,
    assessmentType: string,
  ): Promise<FormTemplateRow | null> {
    return this.execute(tenantId, userId, role, async (dbClient) => {
      const result = await dbClient.query(
        `SELECT ft.id, ft.tenant_id, ft.name, ft.vertical, ft.assessment_type,
                ft.json_schema, ft.ui_schema, ft.is_active,
                ft.created_at, ft.updated_at
         FROM application.form_templates ft
         WHERE ft.assessment_type = $1`,
        [assessmentType],
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  async create(
    tenantId: string,
    userId: string,
    role: string,
    data: {
      name: string;
      vertical: string;
      assessment_type: string;
      json_schema: Record<string, any>;
      ui_schema: Record<string, any>;
      is_active?: boolean;
    },
  ): Promise<FormTemplateRow> {
    return this.execute(tenantId, userId, role, async (dbClient) => {
      const result = await dbClient.query(
        `INSERT INTO application.form_templates
           (tenant_id, name, vertical, assessment_type, json_schema, ui_schema, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          tenantId,
          data.name,
          data.vertical,
          data.assessment_type,
          JSON.stringify(data.json_schema),
          JSON.stringify(data.ui_schema),
          data.is_active !== undefined ? data.is_active : true,
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
      name?: string;
      vertical?: string;
      assessment_type?: string;
      json_schema?: Record<string, any>;
      ui_schema?: Record<string, any>;
      is_active?: boolean;
    },
  ): Promise<FormTemplateRow | null> {
    return this.execute(tenantId, userId, role, async (dbClient) => {
      const setClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
        setClauses.push(`name = $${paramIndex}`);
        params.push(data.name);
        paramIndex++;
      }

      if (data.vertical !== undefined) {
        setClauses.push(`vertical = $${paramIndex}`);
        params.push(data.vertical);
        paramIndex++;
      }

      if (data.assessment_type !== undefined) {
        setClauses.push(`assessment_type = $${paramIndex}`);
        params.push(data.assessment_type);
        paramIndex++;
      }

      if (data.json_schema !== undefined) {
        setClauses.push(`json_schema = $${paramIndex}`);
        params.push(JSON.stringify(data.json_schema));
        paramIndex++;
      }

      if (data.ui_schema !== undefined) {
        setClauses.push(`ui_schema = $${paramIndex}`);
        params.push(JSON.stringify(data.ui_schema));
        paramIndex++;
      }

      if (data.is_active !== undefined) {
        setClauses.push(`is_active = $${paramIndex}`);
        params.push(data.is_active);
        paramIndex++;
      }

      if (setClauses.length === 0) {
        return this.findById(tenantId, userId, role, id);
      }

      setClauses.push(`updated_at = NOW()`);
      params.push(id);

      const result = await dbClient.query(
        `UPDATE application.form_templates
         SET ${setClauses.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        params,
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }
}

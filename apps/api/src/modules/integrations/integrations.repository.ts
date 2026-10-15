import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { TenantAwareRepository } from '../../common/database/tenant-aware.repository';
import { DatabaseService } from '../../database/database.service';

export interface EhrProviderRecord {
  id: string;
  tenant_id: string;
  name: string;
  provider_type: string;
  config: Record<string, any>;
  is_active: boolean;
  last_sync_at: string | null;
  created_at: string;
}

export interface EhrImportLogRecord {
  id: string;
  tenant_id: string;
  provider_id: string;
  import_type: string;
  status: string;
  records_total: number;
  records_imported: number;
  records_skipped: number;
  records_failed: number;
  error_details: Record<string, any> | null;
  started_at: string;
  completed_at: string | null;
}

export interface EhrFieldMappingRecord {
  id: string;
  provider_id: string;
  source_field: string;
  target_table: string;
  target_field: string;
  transform: string | null;
  transform_config: Record<string, any> | null;
  is_required: boolean;
}

@Injectable()
export class IntegrationsRepository extends TenantAwareRepository {
  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  // --- Provider CRUD ---

  async findAllProviders(
    tenantId: string,
    userId: string,
    role: string,
  ): Promise<EhrProviderRecord[]> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT * FROM application.ehr_providers ORDER BY created_at DESC`,
      );
      return result.rows;
    });
  }

  async findProviderById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<EhrProviderRecord | null> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT * FROM application.ehr_providers WHERE id = $1`,
        [id],
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  async createProvider(
    tenantId: string,
    userId: string,
    role: string,
    data: {
      name: string;
      provider_type: string;
      config?: Record<string, any>;
      is_active?: boolean;
    },
  ): Promise<EhrProviderRecord> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `INSERT INTO application.ehr_providers (
          tenant_id, name, provider_type, config, is_active
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [
          tenantId,
          data.name,
          data.provider_type,
          JSON.stringify(data.config || {}),
          data.is_active ?? true,
        ],
      );
      return result.rows[0];
    });
  }

  async updateProvider(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    data: Partial<{
      name: string;
      provider_type: string;
      config: Record<string, any>;
      is_active: boolean;
      last_sync_at: string;
    }>,
  ): Promise<EhrProviderRecord | null> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const setClauses: string[] = [];
      const params: any[] = [];

      if (data.name !== undefined) {
        params.push(data.name);
        setClauses.push(`name = $${params.length}`);
      }
      if (data.provider_type !== undefined) {
        params.push(data.provider_type);
        setClauses.push(`provider_type = $${params.length}`);
      }
      if (data.config !== undefined) {
        params.push(JSON.stringify(data.config));
        setClauses.push(`config = $${params.length}`);
      }
      if (data.is_active !== undefined) {
        params.push(data.is_active);
        setClauses.push(`is_active = $${params.length}`);
      }
      if (data.last_sync_at !== undefined) {
        params.push(data.last_sync_at);
        setClauses.push(`last_sync_at = $${params.length}`);
      }

      if (setClauses.length === 0) {
        return this.findProviderById(tenantId, userId, role, id);
      }

      params.push(id);
      const idIdx = params.length;

      const sql = `
        UPDATE application.ehr_providers
        SET ${setClauses.join(', ')}
        WHERE id = $${idIdx}
        RETURNING *
      `;

      const result = await client.query(sql, params);
      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  // --- Field Mapping CRUD ---

  async findMappingsByProvider(
    tenantId: string,
    userId: string,
    role: string,
    providerId: string,
  ): Promise<EhrFieldMappingRecord[]> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT * FROM application.ehr_field_mappings
         WHERE provider_id = $1
         ORDER BY source_field ASC`,
        [providerId],
      );
      return result.rows;
    });
  }

  async createMapping(
    tenantId: string,
    userId: string,
    role: string,
    data: {
      provider_id: string;
      source_field: string;
      target_table: string;
      target_field: string;
      transform?: string;
      transform_config?: Record<string, any>;
      is_required?: boolean;
    },
  ): Promise<EhrFieldMappingRecord> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `INSERT INTO application.ehr_field_mappings (
          provider_id, source_field, target_table, target_field,
          transform, transform_config, is_required
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (provider_id, source_field) DO UPDATE SET
          target_table = EXCLUDED.target_table,
          target_field = EXCLUDED.target_field,
          transform = EXCLUDED.transform,
          transform_config = EXCLUDED.transform_config,
          is_required = EXCLUDED.is_required
        RETURNING *`,
        [
          data.provider_id,
          data.source_field,
          data.target_table,
          data.target_field,
          data.transform || 'direct',
          data.transform_config ? JSON.stringify(data.transform_config) : null,
          data.is_required ?? false,
        ],
      );
      return result.rows[0];
    });
  }

  async updateMapping(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    data: Partial<{
      source_field: string;
      target_table: string;
      target_field: string;
      transform: string;
      transform_config: Record<string, any>;
      is_required: boolean;
    }>,
  ): Promise<EhrFieldMappingRecord | null> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const setClauses: string[] = [];
      const params: any[] = [];

      if (data.source_field !== undefined) {
        params.push(data.source_field);
        setClauses.push(`source_field = $${params.length}`);
      }
      if (data.target_table !== undefined) {
        params.push(data.target_table);
        setClauses.push(`target_table = $${params.length}`);
      }
      if (data.target_field !== undefined) {
        params.push(data.target_field);
        setClauses.push(`target_field = $${params.length}`);
      }
      if (data.transform !== undefined) {
        params.push(data.transform);
        setClauses.push(`transform = $${params.length}`);
      }
      if (data.transform_config !== undefined) {
        params.push(JSON.stringify(data.transform_config));
        setClauses.push(`transform_config = $${params.length}`);
      }
      if (data.is_required !== undefined) {
        params.push(data.is_required);
        setClauses.push(`is_required = $${params.length}`);
      }

      if (setClauses.length === 0) {
        return null;
      }

      params.push(id);
      const idIdx = params.length;

      const sql = `
        UPDATE application.ehr_field_mappings
        SET ${setClauses.join(', ')}
        WHERE id = $${idIdx}
        RETURNING *
      `;

      const result = await client.query(sql, params);
      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  async deleteMapping(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<boolean> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `DELETE FROM application.ehr_field_mappings WHERE id = $1`,
        [id],
      );
      return (result.rowCount ?? 0) > 0;
    });
  }

  // --- Import Log Methods ---

  async createImportLog(
    tenantId: string,
    userId: string,
    role: string,
    data: {
      provider_id: string;
      import_type: string;
      records_total?: number;
    },
  ): Promise<EhrImportLogRecord> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `INSERT INTO application.ehr_import_logs (
          tenant_id, provider_id, import_type, status, records_total
        ) VALUES ($1, $2, $3, 'processing', $4)
        RETURNING *`,
        [
          tenantId,
          data.provider_id,
          data.import_type,
          data.records_total || 0,
        ],
      );
      return result.rows[0];
    });
  }

  async updateImportLog(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    data: Partial<{
      status: string;
      records_total: number;
      records_imported: number;
      records_skipped: number;
      records_failed: number;
      error_details: Record<string, any>;
      completed_at: string;
    }>,
  ): Promise<EhrImportLogRecord | null> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const setClauses: string[] = [];
      const params: any[] = [];

      if (data.status !== undefined) {
        params.push(data.status);
        setClauses.push(`status = $${params.length}`);
      }
      if (data.records_total !== undefined) {
        params.push(data.records_total);
        setClauses.push(`records_total = $${params.length}`);
      }
      if (data.records_imported !== undefined) {
        params.push(data.records_imported);
        setClauses.push(`records_imported = $${params.length}`);
      }
      if (data.records_skipped !== undefined) {
        params.push(data.records_skipped);
        setClauses.push(`records_skipped = $${params.length}`);
      }
      if (data.records_failed !== undefined) {
        params.push(data.records_failed);
        setClauses.push(`records_failed = $${params.length}`);
      }
      if (data.error_details !== undefined) {
        params.push(JSON.stringify(data.error_details));
        setClauses.push(`error_details = $${params.length}`);
      }
      if (data.completed_at !== undefined) {
        params.push(data.completed_at);
        setClauses.push(`completed_at = $${params.length}`);
      }

      if (setClauses.length === 0) {
        return null;
      }

      params.push(id);
      const idIdx = params.length;

      const sql = `
        UPDATE application.ehr_import_logs
        SET ${setClauses.join(', ')}
        WHERE id = $${idIdx}
        RETURNING *
      `;

      const result = await client.query(sql, params);
      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  async findImportLogsByProvider(
    tenantId: string,
    userId: string,
    role: string,
    providerId?: string,
  ): Promise<EhrImportLogRecord[]> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      if (providerId) {
        const result = await client.query(
          `SELECT * FROM application.ehr_import_logs
           WHERE provider_id = $1
           ORDER BY started_at DESC`,
          [providerId],
        );
        return result.rows;
      }

      const result = await client.query(
        `SELECT * FROM application.ehr_import_logs
         ORDER BY started_at DESC`,
      );
      return result.rows;
    });
  }
}

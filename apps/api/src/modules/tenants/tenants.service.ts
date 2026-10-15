import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  verticalTemplate: string;
  settings: Record<string, unknown>;
  isActive: boolean;
}

@Injectable()
export class TenantsService {
  constructor(private databaseService: DatabaseService) {}

  async getCurrentTenant(tenantId: string): Promise<TenantInfo> {
    const result = await this.databaseService.query(
      `SELECT id, name, slug, vertical_template, settings, is_active
       FROM public.tenants WHERE id = $1`,
      [tenantId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Tenant not found');
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      verticalTemplate: row.vertical_template,
      settings: row.settings || {},
      isActive: row.is_active,
    };
  }
}

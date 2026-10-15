import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { TenantAwareRepository } from '../../common/database/tenant-aware.repository';
import { DatabaseService } from '../../database/database.service';
import { CreateEmploymentOutcomeDto, UpdateEmploymentOutcomeDto } from '@impactforge/shared';

@Injectable()
export class EmploymentOutcomesRepository extends TenantAwareRepository {
  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  async findAllByParticipant(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<any[]> {
    return this.execute(tenantId, userId, role, async (dbClient: PoolClient) => {
      const result = await dbClient.query(
        `SELECT * FROM application.employment_outcomes
         WHERE participant_id = $1
         ORDER BY start_date DESC`,
        [participantId],
      );
      return result.rows;
    });
  }

  async create(
    tenantId: string,
    userId: string,
    role: string,
    dto: CreateEmploymentOutcomeDto,
  ): Promise<any> {
    return this.execute(tenantId, userId, role, async (dbClient: PoolClient) => {
      const keys = Object.keys(dto);
      const values = Object.values(dto);
      const placeholders = keys.map((_, i) => `$${i + 2}`).join(', ');
      
      const query = `
        INSERT INTO application.employment_outcomes (
          tenant_id, ${keys.join(', ')}, created_by, updated_by
        ) VALUES ($1, ${placeholders}, $${keys.length + 2}, $${keys.length + 2})
        RETURNING *
      `;
      
      const params = [tenantId, ...values, userId];
      const result = await dbClient.query(query, params);
      return result.rows[0];
    });
  }
}

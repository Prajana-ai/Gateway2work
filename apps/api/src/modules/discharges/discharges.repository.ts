import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { TenantAwareRepository } from '../../common/database/tenant-aware.repository';
import { DatabaseService } from '../../database/database.service';
import { CreateDischargeDto, UpdateDischargeDto } from '@impactforge/shared';

@Injectable()
export class DischargesRepository extends TenantAwareRepository {
  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  async create(
    tenantId: string,
    userId: string,
    role: string,
    dto: CreateDischargeDto,
  ) {
    return this.execute(tenantId, userId, role, async (dbClient: PoolClient) => {
      const result = await dbClient.query(
        `INSERT INTO protected.discharges (
          tenant_id, participant_id, exit_date, discharge_type, reason_for_exit,
          employment_status_at_exit, training_status_at_exit, recovery_stability_at_exit,
          referrals_at_discharge, follow_up_plans,
          completed_successfully, withdrew_voluntarily, lost_contact,
          referred_to_another_program, incarcerated, hospitalized, deceased,
          non_completion_workforce_exit, completion_workforce_exit,
          wage_at_exit, notes_at_exit, created_by, updated_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $22
        ) RETURNING *`,
        [
          tenantId,
          dto.participant_id,
          dto.exit_date,
          dto.discharge_type,
          dto.reason_for_exit || null,
          dto.employment_status_at_exit || null,
          dto.training_status_at_exit || null,
          dto.recovery_stability_at_exit || null,
          dto.referrals_at_discharge ? JSON.stringify(dto.referrals_at_discharge) : null,
          dto.follow_up_plans || null,
          dto.completed_successfully ?? false,
          dto.withdrew_voluntarily ?? false,
          dto.lost_contact ?? false,
          dto.referred_to_another_program ?? false,
          dto.incarcerated ?? false,
          dto.hospitalized ?? false,
          dto.deceased ?? false,
          dto.non_completion_workforce_exit ?? false,
          dto.completion_workforce_exit ?? false,
          dto.wage_at_exit || null,
          dto.notes_at_exit || null,
          userId,
        ],
      );
      
      // Update participant status to 'completed' or 'inactive' based on exit reason
      let newStatus = 'completed';
      if (dto.deceased || dto.incarcerated || dto.lost_contact || dto.withdrew_voluntarily) {
        newStatus = 'inactive';
      }
      
      await dbClient.query(
        'UPDATE protected.participants SET status = $1, updated_at = NOW(), updated_by = $2 WHERE id = $3',
        [newStatus, userId, dto.participant_id]
      );

      return result.rows[0];
    });
  }

  async findByParticipantId(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ) {
    return this.execute(tenantId, userId, role, async (dbClient: PoolClient) => {
      const result = await dbClient.query(
        'SELECT * FROM protected.discharges WHERE participant_id = $1 ORDER BY exit_date DESC',
        [participantId],
      );
      return result.rows;
    });
  }

  async update(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    dto: UpdateDischargeDto,
  ) {
    return this.execute(tenantId, userId, role, async (dbClient: PoolClient) => {
      const setClauses: string[] = [];
      const params: any[] = [];

      Object.entries(dto).forEach(([key, value]) => {
        if (value !== undefined) {
          params.push(value === 'referrals_at_discharge' ? JSON.stringify(value) : value);
          setClauses.push(`${key} = $${params.length}`);
        }
      });

      if (setClauses.length === 0) return null;

      params.push(id);
      const sql = `UPDATE protected.discharges SET ${setClauses.join(', ')} WHERE id = $${params.length} RETURNING *`;
      const result = await dbClient.query(sql, params);
      return result.rows[0];
    });
  }
}

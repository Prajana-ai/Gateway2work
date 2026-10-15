import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { TenantAwareRepository } from '../../common/database/tenant-aware.repository';
import { DatabaseService } from '../../database/database.service';

export interface EncounterRow {
  id: string;
  tenant_id: string;
  participant_id: string;
  participantName?: string;
  staff_id: string;
  encounter_date: string;
  duration_minutes: number;
  notes: string | null;
  billable: boolean;
  
  // New fields from migration 015
  service_type: string | null;
  service_subcategory: string | null;
  partner_organization_name: string | null;
  location: string | null;
  delivery_mode: string | null;
  format: string | null;
  is_completed: boolean;
  
  recovery_status: string | null;
  recovery_stage: string | null;
  substance_use_treatment: string | null;
  behavioral_health_treatment: string | null;
  peer_support_participation: string | null;
  housing_instability: string | null;
  food_insecurity: string | null;
  childcare_need: string | null;
  transportation_need: string | null;
  legal_support_need: string | null;
  physical_health_need: string | null;
  mental_health_need: string | null;
  trauma_informed_support: string | null;
  
  created_at: string;
  created_by: string;
  updated_by: string;
}

@Injectable()
export class EncountersRepository extends TenantAwareRepository {
  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  async findAll(
    tenantId: string,
    userId: string,
    role: string,
    filters: {
      participantId?: string;
      staffId?: string;
      startDate?: string;
      endDate?: string;
      billable?: boolean;
      page: number;
      limit: number;
    },
  ): Promise<{ items: EncounterRow[]; total: number }> {
    return this.execute(tenantId, userId, role, async (client) => {
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (filters.participantId) {
        conditions.push(`e.participant_id = $${paramIndex}`);
        params.push(filters.participantId);
        paramIndex++;
      }

      if (filters.staffId) {
        conditions.push(`e.staff_id = $${paramIndex}`);
        params.push(filters.staffId);
        paramIndex++;
      }

      if (filters.startDate) {
        conditions.push(`e.encounter_date >= $${paramIndex}`);
        params.push(filters.startDate);
        paramIndex++;
      }

      if (filters.endDate) {
        conditions.push(`e.encounter_date <= $${paramIndex}`);
        params.push(filters.endDate);
        paramIndex++;
      }

      if (filters.billable !== undefined) {
        conditions.push(`e.billable = $${paramIndex}`);
        params.push(filters.billable);
        paramIndex++;
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countResult = await client.query(
        `SELECT COUNT(*) AS total FROM protected.encounters e ${whereClause}`,
        params,
      );
      const total = parseInt(countResult.rows[0].total, 10);

      const offset = (filters.page - 1) * filters.limit;
      const dataParams = [...params, filters.limit, offset];

      const dataResult = await client.query(
        `SELECT e.id, e.tenant_id, e.participant_id, e.staff_id,
                e.encounter_date, e.duration_minutes, e.notes,
                e.billable, e.created_at, e.created_by, e.updated_by,
                e.service_type, e.service_subcategory, e.partner_organization_name,
                e.location, e.delivery_mode, e.format, e.is_completed,
                e.recovery_status, e.recovery_stage, e.substance_use_treatment,
                e.behavioral_health_treatment, e.peer_support_participation,
                e.housing_instability, e.food_insecurity, e.childcare_need,
                e.transportation_need, e.legal_support_need, e.physical_health_need,
                e.mental_health_need, e.trauma_informed_support,
                ((p.demographics->>'first_name') || ' ' || (p.demographics->>'last_name')) AS "participantName"
         FROM protected.encounters e
         LEFT JOIN protected.participants p ON e.participant_id = p.id
         ${whereClause}
         ORDER BY e.encounter_date DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        dataParams,
      );

      return { items: dataResult.rows, total };
    });
  }

  async findById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<EncounterRow | null> {
    return this.execute(tenantId, userId, role, async (client) => {
      const result = await client.query(
        `SELECT e.id, e.tenant_id, e.participant_id, e.staff_id,
                e.encounter_date, e.duration_minutes, e.notes,
                e.billable, e.created_at, e.created_by, e.updated_by,
                e.service_type, e.service_subcategory, e.partner_organization_name,
                e.location, e.delivery_mode, e.format, e.is_completed,
                e.recovery_status, e.recovery_stage, e.substance_use_treatment,
                e.behavioral_health_treatment, e.peer_support_participation,
                e.housing_instability, e.food_insecurity, e.childcare_need,
                e.transportation_need, e.legal_support_need, e.physical_health_need,
                e.mental_health_need, e.trauma_informed_support,
                ((p.demographics->>'first_name') || ' ' || (p.demographics->>'last_name')) AS "participantName"
         FROM protected.encounters e
         LEFT JOIN protected.participants p ON e.participant_id = p.id
         WHERE e.id = $1`,
        [id],
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  async create(
    tenantId: string,
    userId: string,
    role: string,
    data: {
      participant_id: string;
      encounter_date: string;
      duration_minutes: number;
      notes?: string;
      billable: boolean;
      service_type?: string;
      service_subcategory?: string;
      partner_organization_name?: string;
      location?: string;
      delivery_mode?: string;
      format?: string;
      is_completed?: boolean;
      recovery_status?: string;
      recovery_stage?: string;
      substance_use_treatment?: string;
      behavioral_health_treatment?: string;
      peer_support_participation?: string;
      housing_instability?: string;
      food_insecurity?: string;
      childcare_need?: string;
      transportation_need?: string;
      legal_support_need?: string;
      physical_health_need?: string;
      mental_health_need?: string;
      trauma_informed_support?: string;
    },
  ): Promise<EncounterRow> {
    return this.execute(tenantId, userId, role, async (client) => {
      const result = await client.query(
        `INSERT INTO protected.encounters
           (tenant_id, participant_id, staff_id, encounter_date, duration_minutes, notes, billable, created_by, updated_by,
            service_type, service_subcategory, partner_organization_name, location, delivery_mode, format, is_completed,
            recovery_status, recovery_stage, substance_use_treatment, behavioral_health_treatment, peer_support_participation,
            housing_instability, food_insecurity, childcare_need, transportation_need, legal_support_need, physical_health_need,
            mental_health_need, trauma_informed_support)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
         RETURNING *`,
        [
          tenantId,
          data.participant_id,
          userId,
          data.encounter_date,
          data.duration_minutes,
          data.notes || null,
          data.billable,
          userId,
          data.service_type || null,
          data.service_subcategory || null,
          data.partner_organization_name || null,
          data.location || null,
          data.delivery_mode || null,
          data.format || null,
          data.is_completed ?? true,
          data.recovery_status || null,
          data.recovery_stage || null,
          data.substance_use_treatment || null,
          data.behavioral_health_treatment || null,
          data.peer_support_participation || null,
          data.housing_instability || null,
          data.food_insecurity || null,
          data.childcare_need || null,
          data.transportation_need || null,
          data.legal_support_need || null,
          data.physical_health_need || null,
          data.mental_health_need || null,
          data.trauma_informed_support || null,
        ],
      );

      return result.rows[0];
    });
  }

  async getByParticipant(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<EncounterRow[]> {
    return this.execute(tenantId, userId, role, async (client) => {
      const result = await client.query(
        `SELECT e.id, e.tenant_id, e.participant_id, e.staff_id,
                e.encounter_date, e.duration_minutes, e.notes,
                e.billable, e.created_at, e.created_by, e.updated_by,
                e.service_type, e.service_subcategory, e.partner_organization_name,
                e.location, e.delivery_mode, e.format, e.is_completed,
                e.recovery_status, e.recovery_stage, e.substance_use_treatment,
                e.behavioral_health_treatment, e.peer_support_participation,
                e.housing_instability, e.food_insecurity, e.childcare_need,
                e.transportation_need, e.legal_support_need, e.physical_health_need,
                e.mental_health_need, e.trauma_informed_support,
                ((p.demographics->>'first_name') || ' ' || (p.demographics->>'last_name')) AS "participantName"
         FROM protected.encounters e
         LEFT JOIN protected.participants p ON e.participant_id = p.id
         WHERE e.participant_id = $1
         ORDER BY e.encounter_date DESC`,
        [participantId],
      );

      return result.rows;
    });
  }
}

import { Injectable } from '@nestjs/common';
import { TenantAwareRepository } from '../../common/database/tenant-aware.repository';
import { DatabaseService } from '../../database/database.service';

export interface RfeRow {
  id: string;
  tenant_id: string;
  name: string;
  industry: string;
  sector: string;
  locations: any;
  is_rfe_certified: boolean;
  trainee_readiness: string;
  contact_info: any;
  notes: string | null;
  imported_at: string;
  // New fields
  service_provider_id: string | null;
  service_provider_name: string | null;
  contact_person: string | null;
  contact_title: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  employer_address: string | null;
  partnership_start_date: string | null;
  is_fair_chance: boolean;
  hiring_sectors: string | null;
  entry_level_openings: string | null;
  salary_range: string | null;
  benefits_offered: string | null;
  referral_count: number;
  hire_count: number;
  retention_90_day_count: number;
}

export interface ParticipantEmployerMatchRow {
  id: string;
  tenant_id: string;
  participant_id: string;
  rfe_id: string;
  application_status: string;
  outcome: string | null;
  applied_date: string | null;
  outcome_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface MatchWithEmployer extends ParticipantEmployerMatchRow {
  employer_name: string;
  employer_sector: string;
  employer_industry: string;
  employer_locations: any;
  employer_is_rfe_certified: boolean;
  employer_trainee_readiness: string;
  employer_contact_info: any;
}

@Injectable()
export class RfeRepository extends TenantAwareRepository {
  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  private readonly SELECT_COLUMNS = `
    e.id, e.tenant_id, e.name, e.sector, e.industry, e.locations,
    e.is_rfe_certified, e.trainee_readiness, e.contact_info,
    e.notes, e.imported_at, e.service_provider_id, e.service_provider_name,
    e.contact_person, e.contact_title, e.contact_email, e.contact_phone,
    e.employer_address, e.partnership_start_date, e.is_fair_chance,
    e.hiring_sectors, e.entry_level_openings, e.salary_range,
    e.benefits_offered, e.referral_count, e.hire_count, e.retention_90_day_count
  `;

  async findAll(
    tenantId: string,
    userId: string,
    role: string,
    filters: {
      sector?: string;
      industry?: string;
      location?: string;
      traineeReadiness?: string;
      search?: string;
      page: number;
      limit: number;
    },
  ): Promise<{ items: RfeRow[]; total: number }> {
    return this.execute(tenantId, userId, role, async (dbClient) => {
      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (filters.sector) {
        conditions.push(`e.sector = $${paramIndex}`);
        params.push(filters.sector);
        paramIndex++;
      }

      if (filters.industry) {
        conditions.push(`e.industry = $${paramIndex}`);
        params.push(filters.industry);
        paramIndex++;
      }

      if (filters.location) {
        conditions.push(`e.locations @> $${paramIndex}::jsonb`);
        params.push(JSON.stringify([{ city: filters.location }]));
        paramIndex++;
      }

      if (filters.traineeReadiness) {
        conditions.push(`e.trainee_readiness = $${paramIndex}`);
        params.push(filters.traineeReadiness);
        paramIndex++;
      }

      if (filters.search) {
        conditions.push(`(e.name ILIKE $${paramIndex} OR e.industry ILIKE $${paramIndex})`);
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countResult = await dbClient.query(
        `SELECT COUNT(*) AS total FROM application.recovery_friendly_employers e ${whereClause}`,
        params,
      );
      const total = parseInt(countResult.rows[0].total, 10);

      const offset = (filters.page - 1) * filters.limit;
      const dataParams = [...params, filters.limit, offset];

      const dataResult = await dbClient.query(
        `SELECT ${this.SELECT_COLUMNS}
         FROM application.recovery_friendly_employers e
         ${whereClause}
         ORDER BY e.name ASC
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
  ): Promise<RfeRow | null> {
    return this.execute(tenantId, userId, role, async (dbClient) => {
      const result = await dbClient.query(
        `SELECT ${this.SELECT_COLUMNS}
         FROM application.recovery_friendly_employers e
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
    data: Partial<RfeRow>
  ): Promise<RfeRow> {
    return this.execute(tenantId, userId, role, async (dbClient) => {
      const columns = [
        'tenant_id', 'name', 'industry', 'sector', 'locations', 'is_rfe_certified',
        'trainee_readiness', 'contact_info', 'notes', 'imported_at',
        'service_provider_id', 'service_provider_name', 'contact_person',
        'contact_title', 'contact_email', 'contact_phone', 'employer_address',
        'partnership_start_date', 'is_fair_chance', 'hiring_sectors',
        'entry_level_openings', 'salary_range', 'benefits_offered',
        'referral_count', 'hire_count', 'retention_90_day_count'
      ];
      
      const values = [
        tenantId, 
        data.name, 
        data.industry || data.sector, 
        data.sector || data.industry,
        JSON.stringify(data.locations || []),
        data.is_rfe_certified ?? true,
        data.trainee_readiness || 'no',
        JSON.stringify(data.contact_info || {}),
        data.notes || null,
        new Date().toISOString(),
        data.service_provider_id || null,
        data.service_provider_name || null,
        data.contact_person || null,
        data.contact_title || null,
        data.contact_email || null,
        data.contact_phone || null,
        data.employer_address || null,
        data.partnership_start_date || null,
        data.is_fair_chance ?? false,
        data.hiring_sectors || null,
        data.entry_level_openings || null,
        data.salary_range || null,
        data.benefits_offered || null,
        data.referral_count || 0,
        data.hire_count || 0,
        data.retention_90_day_count || 0
      ];

      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      const result = await dbClient.query(
        `INSERT INTO application.recovery_friendly_employers
           (${columns.join(', ')})
         VALUES (${placeholders})
         RETURNING *`,
        values,
      );

      return result.rows[0];
    });
  }

  async bulkImport(
    tenantId: string,
    userId: string,
    role: string,
    employers: Array<Partial<RfeRow>>,
  ): Promise<{ imported: number }> {
    return this.execute(tenantId, userId, role, async (dbClient) => {
      let importedCount = 0;
      for (const emp of employers) {
        await this.create(tenantId, userId, role, emp);
        importedCount++;
      }
      return { imported: importedCount };
    });
  }

  async createMatch(
    tenantId: string,
    userId: string,
    role: string,
    data: {
      participant_id: string;
      rfe_id: string;
      application_status: string;
      notes?: string;
    },
  ): Promise<ParticipantEmployerMatchRow> {
    return this.execute(tenantId, userId, role, async (dbClient) => {
      const result = await dbClient.query(
        `INSERT INTO application.participant_employer_matches
           (tenant_id, participant_id, rfe_id, application_status, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [
          tenantId,
          data.participant_id,
          data.rfe_id,
          data.application_status,
          data.notes || null,
        ],
      );

      return result.rows[0];
    });
  }

  async updateMatch(
    tenantId: string,
    userId: string,
    role: string,
    matchId: string,
    data: {
      application_status?: string;
      outcome?: string;
      outcome_date?: string;
      notes?: string;
    },
  ): Promise<ParticipantEmployerMatchRow | null> {
    return this.execute(tenantId, userId, role, async (dbClient) => {
      const setClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (data.application_status !== undefined) {
        setClauses.push(`application_status = $${paramIndex}`);
        params.push(data.application_status);
        paramIndex++;
      }

      if (data.outcome !== undefined) {
        setClauses.push(`outcome = $${paramIndex}`);
        params.push(data.outcome);
        paramIndex++;
      }

      if (data.outcome_date !== undefined) {
        setClauses.push(`outcome_date = $${paramIndex}`);
        params.push(data.outcome_date);
        paramIndex++;
      }

      if (data.notes !== undefined) {
        setClauses.push(`notes = $${paramIndex}`);
        params.push(data.notes);
        paramIndex++;
      }

      if (setClauses.length === 0) {
        const existing = await dbClient.query(
          `SELECT * FROM application.participant_employer_matches WHERE id = $1`,
          [matchId],
        );
        return existing.rows.length > 0 ? existing.rows[0] : null;
      }

      params.push(matchId);

      const result = await dbClient.query(
        `UPDATE application.participant_employer_matches
         SET ${setClauses.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        params,
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  async getMatchesByParticipant(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<MatchWithEmployer[]> {
    return this.execute(tenantId, userId, role, async (dbClient) => {
      const result = await dbClient.query(
        `SELECT m.id, m.tenant_id, m.participant_id, m.rfe_id,
                m.application_status, m.outcome, m.applied_date,
                m.outcome_date, m.notes, m.created_at,
                e.name AS employer_name,
                e.sector AS employer_sector,
                e.industry AS employer_industry,
                e.locations AS employer_locations,
                e.is_rfe_certified AS employer_is_rfe_certified,
                e.trainee_readiness AS employer_trainee_readiness,
                e.contact_info AS employer_contact_info
         FROM application.participant_employer_matches m
         JOIN application.recovery_friendly_employers e ON e.id = m.rfe_id
         WHERE m.participant_id = $1
         ORDER BY m.created_at DESC`,
        [participantId],
      );

      return result.rows;
    });
  }

  async getMatchesByEmployer(
    tenantId: string,
    userId: string,
    role: string,
    rfeId: string,
  ): Promise<ParticipantEmployerMatchRow[]> {
    return this.execute(tenantId, userId, role, async (dbClient) => {
      const result = await dbClient.query(
        `SELECT m.id, m.tenant_id, m.participant_id, m.rfe_id,
                m.application_status, m.outcome, m.applied_date,
                m.outcome_date, m.notes, m.created_at
         FROM application.participant_employer_matches m
         WHERE m.rfe_id = $1
         ORDER BY m.created_at DESC`,
        [rfeId],
      );

      return result.rows;
    });
  }
}

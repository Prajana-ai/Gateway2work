import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PoolClient } from 'pg';
import * as bcrypt from 'bcryptjs';
import { TenantAwareRepository } from '../../common/database/tenant-aware.repository';
import { DatabaseService } from '../../database/database.service';

export interface ParticipantFilters {
  search?: string;
  status?: string;
  page: number;
  limit: number;
}

export interface ParticipantRecord {
  id: string;
  tenant_id: string;
  participant_id: string | null;
  external_ehr_id: string | null;
  demographics: {
    first_name: string;
    last_name: string;
    preferred_name?: string;
    date_of_birth: string;
    primary_language?: string;
    email: string;
    phone: string;
    preferred_contact_method?: string;
    address: string;
    city?: string;
    county?: string;
    zip_code?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    ssn_last4: string;
    
    // Category 3
    gender?: string;
    pronouns?: string;
    race?: string;
    ethnicity?: string;
    veteran_status?: string;
    disability_status?: string;
    citizenship_status?: string;
    household_size?: number;
    dependents_count?: number;
    parenting_status?: string;
    marital_status?: string;
    
    // Previously added for quantitative attributes
    housing_status?: string;
    transit_status?: string;
    need_childcare?: boolean;
    needs_drivers_license?: boolean;
  };
  legal_info: {
    consent_signed?: boolean;
    consent_date?: string;
    roi_signed?: boolean;
    roi_expiration_date?: string;
    staff_assigned?: string;
    case_manager_assigned?: string;
  };
  socioeconomic: {
    housing_status_at_intake?: string;
    residence_type?: string;
    transportation_access?: string;
    internet_access?: string;
    device_access?: string;
  };
  consent_42cfr: boolean;
  consent_expires_at: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export interface PaginatedParticipants {
  data: ParticipantRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface Participant360View {
  participant: ParticipantRecord;
  referrals: any[];
  assessments: any[];
  workforcePlan: any | null;
  encounters: any[];
  employerMatches: any[];
}

export interface DuplicateMatch {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  similarity_score: number;
}

@Injectable()
export class ParticipantsRepository extends TenantAwareRepository {
  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  async findAll(
    tenantId: string,
    userId: string,
    role: string,
    filters: ParticipantFilters,
  ): Promise<PaginatedParticipants> {
    return this.execute(tenantId, userId, role, async (dbClient: PoolClient) => {
      const { search, status, page, limit } = filters;
      const offset = (page - 1) * limit;
      const params: any[] = [];
      const conditions: string[] = [];

      if (search) {
        params.push(`%${search}%`);
        const searchIdx = params.length;
        params.push(search);
        const termIdx = params.length;
        
        conditions.push(
          `(demographics->>'first_name' ILIKE $${searchIdx} 
            OR demographics->>'last_name' ILIKE $${searchIdx}
            OR similarity(demographics->>'first_name', $${termIdx}) > 0.3
            OR similarity(demographics->>'last_name', $${termIdx}) > 0.3)`
        );
      }

      if (status) {
        params.push(status);
        conditions.push(`status = $${params.length}`);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      params.push(limit);
      const limitIdx = params.length;
      params.push(offset);
      const offsetIdx = params.length;

      const sql = `
        SELECT *, COUNT(*) OVER() AS total_count
        FROM protected.participants
        ${whereClause}
        ORDER BY 
          ${search ? `GREATEST(
              similarity(demographics->>'first_name', $2),
              similarity(demographics->>'last_name', $2)
            ) DESC,` : ''}
          created_at DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `;

      const result = await dbClient.query(sql, params);

      const total =
        result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
      const data = result.rows.map(({ total_count, ...row }: { total_count: string; [key: string]: any }) => row as ParticipantRecord);

      return { data, total, page, limit };
    });
  }

  async findById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<ParticipantRecord | null> {
    return this.execute(tenantId, userId, role, async (dbClient: PoolClient) => {
      const result = await dbClient.query(
        `SELECT * FROM protected.participants WHERE id = $1`,
        [id],
      );
      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  async find360View(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<any | null> {
    return this.execute(tenantId, userId, role, async (dbClient: PoolClient) => {
      // Bypass RLS for the 360 view
      await dbClient.query("SELECT set_config('app.consent_management_mode', 'true', true)");

      // Client data
      const clientResult = await dbClient.query(
        `SELECT p.*, COALESCE(e.referral_source, r.provider_agency_name) AS referral_source
         FROM protected.participants p
         LEFT JOIN LATERAL (
            SELECT provider_agency_name 
            FROM protected.referrals 
            WHERE participant_id = p.id 
            ORDER BY ingested_at DESC 
            LIMIT 1
         ) r ON true
         LEFT JOIN LATERAL (
            SELECT referral_source 
            FROM protected.enrollments 
            WHERE participant_id = p.id 
            ORDER BY created_at DESC 
            LIMIT 1
         ) e ON true
         WHERE p.id = $1`,
        [id],
      );

      if (clientResult.rows.length === 0) {
        return null;
      }

      // Recent referrals (last 5) - using ingested_at as created_at
      const referralsResult = await dbClient.query(
        `SELECT *, ingested_at as created_at FROM protected.referrals
         WHERE participant_id = $1
         ORDER BY ingested_at DESC
         LIMIT 5`,
        [id],
      );

      // All assessments
      const assessmentsResult = await dbClient.query(
        `SELECT * FROM protected.assessments
         WHERE participant_id = $1
         ORDER BY created_at DESC`,
        [id],
      );

      // Active workforce plan
      const workforcePlanResult = await dbClient.query(
        `SELECT * FROM application.workforce_plans
         WHERE participant_id = $1 AND status = 'active'
         ORDER BY created_at DESC
         LIMIT 1`,
        [id],
      );

      // Recent encounters (last 10)
      const encountersResult = await dbClient.query(
        `SELECT * FROM protected.encounters
         WHERE participant_id = $1
         ORDER BY created_at DESC
         LIMIT 10`,
        [id],
      );

      // Employer matches
      const employerMatchesResult = await dbClient.query(
        `SELECT * FROM application.participant_employer_matches
         WHERE participant_id = $1
         ORDER BY created_at DESC`,
        [id],
      );

      // Map referrals to a timeline-like structure for the frontend
      const timeline = referralsResult.rows.map(ref => ({
        id: ref.id,
        type: 'Referral',
        description: `Participant referred (${ref.referral_status})`,
        createdAt: ref.ingested_at
      }));

      // Enrollments
      const enrollmentsResult = await dbClient.query(
        `SELECT * FROM protected.enrollments
         WHERE participant_id = $1
         ORDER BY enrollment_date DESC`,
        [id],
      );

      return {
        participant: clientResult.rows[0],
        referrals: referralsResult.rows,
        enrollments: enrollmentsResult.rows,
        timeline,
        assessments: assessmentsResult.rows,
        workforcePlan: workforcePlanResult.rows[0] || null,
        encounters: encountersResult.rows,
        matches: employerMatchesResult.rows,
      };
    });
  }

  async create(
    tenantId: string,
    userId: string,
    role: string,
    data: {
      participant_id?: string;
      external_ehr_id?: string;
      referral_source?: string;
      referral_date?: string;
      demographics: Record<string, any>;
      legal_info?: Record<string, any>;
      socioeconomic?: Record<string, any>;
      consent_42cfr?: boolean;
      consent_expires_at?: string;
      status?: string;
    },
  ): Promise<ParticipantRecord> {
    return this.execute(tenantId, userId, role, async (dbClient: PoolClient) => {
      // Set consent management mode to true LOCALly for this transaction
      // so RETURNING * can see the record even if consent_42cfr is false.
      await dbClient.query("SELECT set_config('app.consent_management_mode', 'true', true)");

      const result = await dbClient.query(
        `INSERT INTO protected.participants (
          tenant_id, participant_id, external_ehr_id,
          demographics, legal_info, socioeconomic, consent_42cfr, consent_expires_at, status,
          created_by, updated_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
        ) RETURNING *`,
        [
          tenantId,
          data.participant_id || null,
          data.external_ehr_id || null,
          JSON.stringify(data.demographics),
          JSON.stringify(data.legal_info || {}),
          JSON.stringify(data.socioeconomic || {}),
          data.consent_42cfr ?? false,
          data.consent_expires_at || null,
          data.status || 'active',
          userId,
          userId,
        ],
      );
      
      const participant = result.rows[0];

      // Automatically create user login credentials in public.users for the participant
      const participantEmail = data.demographics?.email;
      if (participantEmail) {
        const roleResult = await dbClient.query(
          `SELECT id FROM public.roles WHERE tenant_id = $1 AND name = 'participant' LIMIT 1`,
          [tenantId],
        );

        if (roleResult.rows.length > 0) {
          const participantRoleId = roleResult.rows[0].id;
          const passwordHash = await bcrypt.hash('changeme123', 12);
          const firstName = data.demographics?.first_name || '';
          const lastName = data.demographics?.last_name || '';

          await dbClient.query(
            `INSERT INTO public.users
               (id, tenant_id, email, password_hash, role_id, first_name, last_name, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7, true)
             ON CONFLICT (tenant_id, email) DO UPDATE
               SET password_hash = EXCLUDED.password_hash,
                   role_id = EXCLUDED.role_id,
                   first_name = EXCLUDED.first_name,
                   last_name = EXCLUDED.last_name,
                   is_active = true`,
            [
              participant.id,
              tenantId,
              participantEmail.trim().toLowerCase(),
              passwordHash,
              participantRoleId,
              firstName,
              lastName,
            ],
          );
        }
      }

      // If referral info is provided, create an enrollment record
      if (data.referral_source || data.referral_date) {
        await dbClient.query(
          `INSERT INTO protected.enrollments (
            tenant_id, participant_id, referral_source, referral_date, created_by, updated_by
          ) VALUES ($1, $2, $3, $4, $5, $5)`,
          [
            tenantId,
            participant.id,
            data.referral_source || null,
            data.referral_date || null,
            userId,
          ]
        );
      }

      return participant;
    });
  }

  async update(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    data: Partial<{
      participant_id: string;
      external_ehr_id: string;
      demographics: Record<string, any>;
      legal_info: Record<string, any>;
      socioeconomic: Record<string, any>;
      consent_42cfr: boolean;
      consent_expires_at: string;
      status: string;
    }>,
  ): Promise<ParticipantRecord | null> {
    return this.execute(tenantId, userId, role, async (dbClient: PoolClient) => {
      // Set consent management mode to true LOCALly for this transaction
      await dbClient.query("SELECT set_config('app.consent_management_mode', 'true', true)");

      const setClauses: string[] = [];
      const params: any[] = [];

      if (data.participant_id !== undefined) {
        params.push(data.participant_id);
        setClauses.push(`participant_id = $${params.length}`);
      }
      if (data.external_ehr_id !== undefined) {
        params.push(data.external_ehr_id);
        setClauses.push(`external_ehr_id = $${params.length}`);
      }
      if (data.demographics !== undefined) {
        params.push(JSON.stringify(data.demographics));
        setClauses.push(`demographics = $${params.length}`);
      }
      if (data.legal_info !== undefined) {
        params.push(JSON.stringify(data.legal_info));
        setClauses.push(`legal_info = $${params.length}`);
      }
      if (data.socioeconomic !== undefined) {
        params.push(JSON.stringify(data.socioeconomic));
        setClauses.push(`socioeconomic = $${params.length}`);
      }
      if (data.consent_42cfr !== undefined) {
        params.push(data.consent_42cfr);
        setClauses.push(`consent_42cfr = $${params.length}`);
      }
      if (data.consent_expires_at !== undefined) {
        params.push(data.consent_expires_at);
        setClauses.push(`consent_expires_at = $${params.length}`);
      }
      if (data.status !== undefined) {
        params.push(data.status);
        setClauses.push(`status = $${params.length}`);
      }

      if (setClauses.length === 0) {
        return this.findById(tenantId, userId, role, id);
      }

      params.push(userId);
      setClauses.push(`updated_by = $${params.length}`);
      setClauses.push(`updated_at = NOW()`);

      params.push(id);
      const idIdx = params.length;

      const sql = `
        UPDATE protected.participants
        SET ${setClauses.join(', ')}
        WHERE id = $${idIdx}
        RETURNING *
      `;

      const result = await dbClient.query(sql, params);
      return result.rows.length > 0 ? result.rows[0] : null;
    });
  }

  async checkDuplicate(
    tenantId: string,
    userId: string,
    role: string,
    firstName: string,
    lastName: string,
    dob: string,
  ): Promise<DuplicateMatch[]> {
    return this.execute(tenantId, userId, role, async (dbClient: PoolClient) => {
      const result = await dbClient.query(
        `SELECT
          id,
          demographics->>'first_name' AS first_name,
          demographics->>'last_name' AS last_name,
          demographics->>'date_of_birth' AS date_of_birth,
          GREATEST(
            similarity(demographics->>'first_name', $1),
            similarity(demographics->>'last_name', $2)
          ) AS similarity_score
        FROM protected.participants
        WHERE similarity(demographics->>'first_name', $1) > 0.3
          OR similarity(demographics->>'last_name', $2) > 0.3
          OR demographics->>'date_of_birth' = $3
        ORDER BY similarity_score DESC
        LIMIT 10`,
        [firstName, lastName, dob],
      );
      return result.rows;
    });
  }

  async provisionLogin(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
    customPassword?: string,
  ): Promise<{ success: boolean; email: string; temporaryPassword: string; message: string }> {
    return this.execute(tenantId, userId, role, async (dbClient: PoolClient) => {
      await dbClient.query("SELECT set_config('app.consent_management_mode', 'true', true)");

      const participantResult = await dbClient.query(
        `SELECT * FROM protected.participants WHERE id = $1`,
        [id],
      );

      if (participantResult.rows.length === 0) {
        throw new NotFoundException(`Participant with id ${id} not found`);
      }

      const participant = participantResult.rows[0];
      const email = participant.demographics?.email;

      if (!email) {
        throw new BadRequestException('Participant has no email address on record');
      }

      const roleResult = await dbClient.query(
        `SELECT id FROM public.roles WHERE tenant_id = $1 AND name = 'participant' LIMIT 1`,
        [tenantId],
      );

      if (roleResult.rows.length === 0) {
        throw new BadRequestException('Participant system role not configured for this tenant');
      }

      const participantRoleId = roleResult.rows[0].id;
      const tempPassword = customPassword || 'changeme123';
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      const firstName = participant.demographics?.first_name || '';
      const lastName = participant.demographics?.last_name || '';

      await dbClient.query(
        `INSERT INTO public.users
           (id, tenant_id, email, password_hash, role_id, first_name, last_name, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         ON CONFLICT (tenant_id, email) DO UPDATE
           SET password_hash = EXCLUDED.password_hash,
               role_id = EXCLUDED.role_id,
               first_name = EXCLUDED.first_name,
               last_name = EXCLUDED.last_name,
               is_active = true`,
        [
          id,
          tenantId,
          email.trim().toLowerCase(),
          passwordHash,
          participantRoleId,
          firstName,
          lastName,
        ],
      );

      return {
        success: true,
        email: email.trim().toLowerCase(),
        temporaryPassword: tempPassword,
        message: 'Participant login account provisioned/reset successfully.',
      };
    });
  }
}

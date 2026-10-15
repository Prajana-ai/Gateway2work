import { Injectable } from '@nestjs/common';
import { TenantAwareRepository } from '../../common/database/tenant-aware.repository';
import { DatabaseService } from '../../database/database.service';

export interface IpsFidelityReviewRow {
  id: string;
  tenant_id: string;
  reviewer_id: string | null;
  review_date: string;
  status: 'draft' | 'finalized';
  total_score: number;
  score_312_competitive_work: number | null;
  score_313_caseload_size: number | null;
  score_314_employment_staff: number | null;
  score_315_vocational_generalists: number | null;
  score_316_mh_integration: number | null;
  score_317_mh_contact: number | null;
  score_318_vr_collaboration: number | null;
  score_319_vocational_unit: number | null;
  score_320_ips_supervisor: number | null;
  score_321_zero_exclusion: number | null;
  score_322_agency_promotion: number | null;
  score_323_exec_support: number | null;
  score_324_work_incentive_planning: number | null;
  score_325_disclosure: number | null;
  score_326_vocational_assessment: number | null;
  score_327_rapid_job_search: number | null;
  score_328_individualized_job_search: number | null;
  score_329_employer_contact: number | null;
  score_330_employer_contact_quality: number | null;
  score_331_job_diversity: number | null;
  score_332_employer_diversity: number | null;
  score_333_competitive_jobs: number | null;
  score_334_individualized_follow_along: number | null;
  score_335_time_unlimited_follow_along: number | null;
  score_336_community_services: number | null;
  score_337_assertive_engagement: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class IpsRepository extends TenantAwareRepository {
  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  async findAll(tenantId: string, userId: string, role: string) {
    return this.execute(tenantId, userId, role, async (participant) => {
      const result = await participant.query(
        `SELECT r.*, s.first_name || ' ' || s.last_name as reviewer_name
         FROM application.ips_fidelity_reviews r
         LEFT JOIN public.staff s ON s.id = r.reviewer_id
         WHERE r.tenant_id = $1
         ORDER BY r.review_date DESC`,
        [tenantId],
      );
      return result.rows;
    });
  }

  async findById(tenantId: string, userId: string, role: string, id: string) {
    return this.execute(tenantId, userId, role, async (participant) => {
      const result = await participant.query(
        `SELECT r.*, s.first_name || ' ' || s.last_name as reviewer_name
         FROM application.ips_fidelity_reviews r
         LEFT JOIN public.staff s ON s.id = r.reviewer_id
         WHERE r.id = $1`,
        [id],
      );
      return result.rows[0] || null;
    });
  }

  async create(tenantId: string, userId: string, role: string, data: Partial<IpsFidelityReviewRow>) {
    return this.execute(tenantId, userId, role, async (participant) => {
      const columns = Object.keys(data).filter(k => k !== 'id' && k !== 'tenant_id');
      const values = columns.map(k => (data as any)[k]);
      const placeholders = columns.map((_, i) => `$${i + 2}`).join(', ');

      const result = await participant.query(
        `INSERT INTO application.ips_fidelity_reviews (tenant_id, ${columns.join(', ')})
         VALUES ($1, ${placeholders})
         RETURNING *`,
        [tenantId, ...values],
      );
      return result.rows[0];
    });
  }

  async update(tenantId: string, userId: string, role: string, id: string, data: Partial<IpsFidelityReviewRow>) {
    return this.execute(tenantId, userId, role, async (participant) => {
      const columns = Object.keys(data).filter(k => k !== 'id' && k !== 'tenant_id');
      const setClauses = columns.map((k, i) => `${k} = $${i + 2}`).join(', ');
      const values = columns.map(k => (data as any)[k]);

      const result = await participant.query(
        `UPDATE application.ips_fidelity_reviews
         SET ${setClauses}, updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id, ...values],
      );
      return result.rows[0];
    });
  }

  async getStaffIdByUserId(tenantId: string, userId: string, role: string): Promise<string | null> {
    return this.execute(tenantId, userId, role, async (participant) => {
      const result = await participant.query(
        `SELECT id FROM public.staff WHERE user_id = $1 AND tenant_id = $2`,
        [userId, tenantId],
      );
      return result.rows[0]?.id || null;
    });
  }

  // --- Automated Calculation Queries ---

  async getCaseloadStats(tenantId: string, userId: string, role: string) {
    return this.execute(tenantId, userId, role, async (participant) => {
      const result = await participant.query(
        `SELECT s.id as staff_id, s.first_name, s.last_name, 
                COUNT(p.id) as caseload_size
         FROM public.staff s
         LEFT JOIN protected.participants p ON p.tenant_id = s.tenant_id AND p.status = 'active'
         GROUP BY s.id`,
      );
      return result.rows;
    });
  }

  async getAutomatedFidelityStats(tenantId: string, userId: string, role: string) {
    return this.execute(tenantId, userId, role, async (participant) => {
      try {
        // 312: Competitive Work (% of active participants employed)
        const competitiveWorkRes = await participant.query(`
          SELECT 
            (SELECT COUNT(DISTINCT participant_id) FROM application.employment_outcomes) as hired_count,
            (SELECT COUNT(*) FROM protected.participants WHERE status = 'active') as active_count
        `);
        
        // 313: Caseload Size (Avg active participants per specialist)
        const caseloadRes = await participant.query(`
          SELECT COALESCE(AVG(caseload), 0) as avg_caseload
          FROM (
            SELECT staff_id, COUNT(DISTINCT participant_id) as caseload
            FROM protected.encounters
            WHERE encounter_date >= CURRENT_DATE - INTERVAL '90 days'
            GROUP BY staff_id
          ) sub
        `);

        // 327: Rapid Job Search (Avg days to first employer contact)
        const rapidSearchRes = await participant.query(`
          WITH first_contact AS (
            SELECT e.participant_id, MIN(e.encounter_date) as contact_date
            FROM protected.encounters e
            WHERE e.service_type IN ('employer_engagement_activity', 'job_search_assistance')
            GROUP BY e.participant_id
          )
          SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (fc.contact_date - en.enrollment_date)) / 86400), 0) as avg_days
          FROM protected.enrollments en
          JOIN first_contact fc ON fc.participant_id = en.participant_id
        `);

        // 329: Frequent Employer Contact (Weekly face-to-face contacts per specialist)
        const freqContactRes = await participant.query(`
          SELECT COALESCE(AVG(weekly_count), 0) as avg_weekly_contacts
          FROM (
            SELECT staff_id, DATE_TRUNC('week', encounter_date) as week, COUNT(*) as weekly_count
            FROM protected.encounters
            WHERE service_type = 'employer_engagement_activity'
              AND delivery_mode = 'in_person'
            GROUP BY staff_id, week
          ) sub
        `);

        const comp = competitiveWorkRes.rows[0];
        const activeCount = parseInt(comp.active_count || '0', 10);
        const hiredCount = parseInt(comp.hired_count || '0', 10);
        
        return {
          competitiveWorkRate: activeCount > 0 ? (hiredCount / activeCount) * 100 : 0,
          averageCaseload: parseFloat(caseloadRes.rows[0].avg_caseload || '0'),
          averageDaysToFirstContact: Math.round(parseFloat(rapidSearchRes.rows[0].avg_days || '0')),
          averageWeeklyEmployerContacts: parseFloat(freqContactRes.rows[0].avg_weekly_contacts || '0'),
        };
      } catch (error) {
        console.error('Error calculating automated IPS stats:', error);
        // Return default zeros instead of 500 to keep UI functional
        return {
          competitiveWorkRate: 0,
          averageCaseload: 0,
          averageDaysToFirstContact: 0,
          averageWeeklyEmployerContacts: 0,
        };
      }
    });
  }
}

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { RecommendedReportingVariablesDto } from '@impactforge/shared';

export interface EncounterExportRow {
  encounter_id: string;
  encounter_date: string;
  participant_id: string;
  staff_id: string;
  duration_minutes: number;
  billable: boolean;
  service_code: string;
  rendering_provider_id: string;
  place_of_service: string;
  diagnosis_code: string;
  units: number;
  modifier: string;
  notes: string | null;
  created_at: string;
}

export interface PlacementMetrics {
  total_matches: number;
  total_hired: number;
  placement_rate: number;
  average_days_to_placement: number;
  breakdown: Array<{
    group_key: string;
    total_matches: number;
    total_hired: number;
    placement_rate: number;
  }>;
}

export interface DashboardStats {
  activeParticipants: number;
  pendingReferrals: number;
  activePlans: number;
  monthEncounters: number;
  placementRate: number;
}

export interface EmployabilityMetric {
  participantId: string;
  enrollmentDate: string;
  outcome: string;
  score: number;
  weeksInProgram: number;
  sectors: string[];
  resources: number;
  inhibitors: number;
}

@Injectable()
export class ReportsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getEncounterExport(
    tenantId: string,
    userId: string,
    role: string,
    startDate: string,
    endDate: string,
  ): Promise<EncounterExportRow[]> {
    if (!startDate || !endDate) {
      throw new BadRequestException(
        'Both start_date and end_date are required',
      );
    }

    return this.databaseService.executeInTenantContext(
      tenantId,
      userId,
      role,
      async (dbClient) => {
        const result = await dbClient.query(
          `SELECT
             e.id AS encounter_id,
             e.encounter_date,
             e.participant_id,
             e.staff_id,
             e.duration_minutes,
             e.billable,
             CASE
               WHEN e.duration_minutes <= 15 THEN 'H0004'
               WHEN e.duration_minutes <= 30 THEN 'H0004:HQ'
               WHEN e.duration_minutes <= 60 THEN 'H2014'
               ELSE 'H2014:HQ'
             END AS service_code,
             e.staff_id AS rendering_provider_id,
             '11' AS place_of_service,
             '' AS diagnosis_code,
             GREATEST(1, CEIL(e.duration_minutes / 15.0)) AS units,
             CASE
               WHEN e.duration_minutes > 30 THEN 'HQ'
               ELSE ''
             END AS modifier,
             e.notes,
             e.created_at
           FROM protected.encounters e
           WHERE e.billable = true
             AND e.encounter_date >= $1
             AND e.encounter_date <= $2
           ORDER BY e.encounter_date ASC, e.participant_id ASC`,
          [startDate, endDate],
        );

        return result.rows;
      },
    );
  }

  async getPlacementMetrics(
    tenantId: string,
    userId: string,
    role: string,
    groupBy?: string,
  ): Promise<PlacementMetrics> {
    return this.databaseService.executeInTenantContext(
      tenantId,
      userId,
      role,
      async (dbClient) => {
        // Overall placement metrics
        const overallResult = await dbClient.query(
          `SELECT
             COUNT(*) AS total_matches,
             COUNT(*) FILTER (WHERE m.outcome = 'hired') AS total_hired,
             CASE
               WHEN COUNT(*) > 0
               THEN ROUND(
                 (COUNT(*) FILTER (WHERE m.outcome = 'hired')::numeric / COUNT(*)::numeric) * 100,
                 2
               )
               ELSE 0
             END AS placement_rate,
             COALESCE(
               AVG(
                 EXTRACT(EPOCH FROM (m.outcome_date - m.created_at)) / 86400
               ) FILTER (WHERE m.outcome = 'hired' AND m.outcome_date IS NOT NULL),
               0
             ) AS average_days_to_placement
           FROM application.participant_employer_matches m`,
        );

        const overall = overallResult.rows[0];

        // Breakdown by group
        let breakdownSql: string;
        if (groupBy === 'month') {
          breakdownSql = `SELECT
             TO_CHAR(m.created_at, 'YYYY-MM') AS group_key,
             COUNT(*) AS total_matches,
             COUNT(*) FILTER (WHERE m.outcome = 'hired') AS total_hired,
             CASE WHEN COUNT(*) > 0
               THEN ROUND((COUNT(*) FILTER (WHERE m.outcome = 'hired')::numeric / COUNT(*)::numeric) * 100, 2)
               ELSE 0 END AS placement_rate
           FROM application.participant_employer_matches m
           GROUP BY TO_CHAR(m.created_at, 'YYYY-MM')
           ORDER BY 1`;
        } else {
          breakdownSql = `SELECT
             COALESCE(r.sector, 'Unknown') AS group_key,
             COUNT(*) AS total_matches,
             COUNT(*) FILTER (WHERE m.outcome = 'hired') AS total_hired,
             CASE WHEN COUNT(*) > 0
               THEN ROUND((COUNT(*) FILTER (WHERE m.outcome = 'hired')::numeric / COUNT(*)::numeric) * 100, 2)
               ELSE 0 END AS placement_rate
           FROM application.participant_employer_matches m
           LEFT JOIN application.recovery_friendly_employers r ON r.id = m.rfe_id
           GROUP BY COALESCE(r.sector, 'Unknown')
           ORDER BY 1`;
        }

        const breakdownResult = await dbClient.query(breakdownSql);

        return {
          total_matches: parseInt(overall.total_matches || '0', 10),
          total_hired: parseInt(overall.total_hired || '0', 10),
          placement_rate: parseFloat(overall.placement_rate || '0'),
          average_days_to_placement: parseFloat(
            overall.average_days_to_placement || '0',
          ),
          breakdown: breakdownResult.rows.map((row) => ({
            group_key: row.group_key,
            total_matches: parseInt(row.total_matches || '0', 10),
            total_hired: parseInt(row.total_hired || '0', 10),
            placement_rate: parseFloat(row.placement_rate || '0'),
          })),
        };
      },
    );
  }

  async getDashboardStats(
    tenantId: string,
    userId: string,
    role: string,
  ): Promise<DashboardStats> {
    return this.databaseService.executeInTenantContext(
      tenantId,
      userId,
      role,
      async (dbClient) => {
        const [
          participantsResult,
          referralsResult,
          plansResult,
          encountersResult,
          placementResult,
        ] = await Promise.all([
          dbClient.query(
            `SELECT COUNT(*) AS count
             FROM protected.participants
             WHERE status = 'active'`,
          ),
          dbClient.query(
            `SELECT COUNT(*) AS count
             FROM protected.referrals
             WHERE referral_status = 'pending'`,
          ),
          dbClient.query(
            `SELECT COUNT(*) AS count
             FROM application.workforce_plans
             WHERE status = 'active'`,
          ),
          dbClient.query(
            `SELECT COUNT(*) AS count
             FROM protected.encounters
             WHERE encounter_date >= DATE_TRUNC('month', CURRENT_DATE)
               AND encounter_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'`,
          ),
          dbClient.query(
            `SELECT
               CASE
                 WHEN COUNT(*) > 0
                 THEN ROUND(
                   (COUNT(*) FILTER (WHERE outcome = 'hired')::numeric / COUNT(*)::numeric) * 100,
                   2
                 )
                 ELSE 0
               END AS placement_rate
             FROM application.participant_employer_matches`,
          ),
        ]);

        return {
          activeParticipants: parseInt(participantsResult.rows[0].count || '0', 10),
          pendingReferrals: parseInt(referralsResult.rows[0].count || '0', 10),
          activePlans: parseInt(plansResult.rows[0].count || '0', 10),
          monthEncounters: parseInt(encountersResult.rows[0].count || '0', 10),
          placementRate: parseFloat(placementResult.rows[0].placement_rate || '0'),
        };
      },
    );
  }

  async getRecommendedVariables(
    tenantId: string,
    userId: string,
    role: string,
  ): Promise<RecommendedReportingVariablesDto> {
    return this.databaseService.executeInTenantContext(
      tenantId,
      userId,
      role,
      async (dbClient) => {
        try {
          const queries = {
            totals: dbClient.query(`
              SELECT 
                (SELECT COUNT(*) FROM protected.enrollments) as total_enrolled,
                (SELECT COUNT(*) FROM protected.participants WHERE status = 'active') as total_active,
                (SELECT COUNT(*) FROM protected.discharges) as total_exited,
                (SELECT COUNT(DISTINCT participant_id) FROM protected.encounters WHERE service_type ILIKE '%case management%') as receiving_cm,
                (SELECT COUNT(DISTINCT participant_id) FROM protected.trainings) as receiving_training,
                (SELECT COUNT(DISTINCT participant_id) FROM protected.trainings WHERE credential_earned IS NOT NULL) as earned_credentials,
                (SELECT COUNT(*) FROM application.employment_outcomes) as placed_employment,
                (SELECT COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY starting_wage), 0) FROM application.employment_outcomes) as median_wage,
                (SELECT COUNT(*) FROM application.employment_outcomes WHERE retention_90_day = true) as retention_90,
                (SELECT COUNT(*) FROM application.employment_outcomes WHERE employed_at_180_days = true) as retention_180
            `),
            avgTime: dbClient.query(`
              SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (eo.start_date - p.created_at)) / 86400), 0) as avg_days
              FROM application.employment_outcomes eo
              JOIN protected.participants p ON p.id = eo.participant_id
            `),
            avgServices: dbClient.query(`
              SELECT COALESCE(AVG(count), 0) as avg_count
              FROM (
                SELECT COUNT(*) as count 
                FROM protected.encounters 
                GROUP BY participant_id
              ) s
            `),
            topBarriers: dbClient.query(`
              WITH barriers AS (
                SELECT jsonb_array_elements(scores->'barriers')->>'barrier' as barrier_name
                FROM application.assessment_summaries
                WHERE scores->'barriers' IS NOT NULL
              )
              SELECT barrier_name as barrier, COUNT(*)::int as count
              FROM barriers
              WHERE barrier_name IS NOT NULL
              GROUP BY barrier_name
              ORDER BY count DESC
              LIMIT 5
            `),
            topSources: dbClient.query(`
              SELECT referral_source as source, COUNT(*)::int as count
              FROM protected.enrollments
              WHERE referral_source IS NOT NULL
              GROUP BY referral_source
              ORDER BY count DESC
              LIMIT 5
            `),

            topIndustries: dbClient.query(`
              SELECT employer_industry as industry, COUNT(*)::int as count
              FROM application.employment_outcomes
              WHERE employer_industry IS NOT NULL
              GROUP BY employer_industry
              ORDER BY count DESC
              LIMIT 5
            `)
          };

          const [
            totalsRes,
            avgTimeRes,
            avgServicesRes,
            topBarriersRes,
            topSourcesRes,
            topIndustriesRes
          ] = await Promise.all([
            queries.totals,
            queries.avgTime,
            queries.avgServices,
            queries.topBarriers,
            queries.topSources,
            queries.topIndustries
          ]);

          const totals = totalsRes.rows[0];
          const avgTime = avgTimeRes.rows[0];
          const avgServices = avgServicesRes.rows[0];
          const topBarriers = topBarriersRes.rows;
          const topSources = topSourcesRes.rows;
          const topIndustries = topIndustriesRes.rows;

          return {
            totalEnrolled: parseInt(totals.total_enrolled || '0', 10),
            totalActiveParticipants: parseInt(totals.total_active || '0', 10),
            totalExited: parseInt(totals.total_exited || '0', 10),
            numberReceivingCaseManagement: parseInt(totals.receiving_cm || '0', 10),
            numberReceivingTraining: parseInt(totals.receiving_training || '0', 10),
            numberEarningCredentials: parseInt(totals.earned_credentials || '0', 10),
            numberPlacedInEmployment: parseInt(totals.placed_employment || '0', 10),
            medianWageAtPlacement: parseFloat(totals.median_wage || '0'),
            retentionAt90Days: parseInt(totals.retention_90 || '0', 10),
            retentionAt6Months: parseInt(totals.retention_180 || '0', 10),
            averageTimeIntakeToPlacement: Math.round(parseFloat(avgTime.avg_days || '0')),
            averageServicesPerParticipant: parseFloat(parseFloat(avgServices.avg_count || '0').toFixed(1)),
            topBarriers: topBarriers,
            topReferralSources: topSources,
            topIndustriesForPlacement: topIndustries,
          };
        } catch (error) {
          console.error('Detailed Error in getRecommendedVariables:', error);
          throw error;
        }
      }
    );
  }

  async getEmployabilityMetrics(
    tenantId: string,
    userId: string,
    role: string,
  ): Promise<EmployabilityMetric[]> {
    return this.databaseService.executeInTenantContext(
      tenantId,
      userId,
      role,
      async (dbClient) => {
        const result = await dbClient.query(
          `WITH latest_summaries AS (
             SELECT DISTINCT ON (participant_id, assessment_type)
               participant_id,
               assessment_type,
               scores,
               computed_at
             FROM application.assessment_summaries
             ORDER BY participant_id, assessment_type, computed_at DESC
           ),
           participant_scores AS (
             SELECT
               p.id AS participant_id,
               p.created_at,
               p.status,
               jsonb_agg(ls.scores) AS all_scores
             FROM protected.participants p
             LEFT JOIN latest_summaries ls ON ls.participant_id = p.id
             WHERE p.status IN ('active', 'completed')
             GROUP BY p.id, p.created_at, p.status
           )
           SELECT
             participant_id,
             created_at,
             status,
             all_scores
           FROM participant_scores`,
        );

        return result.rows.map((row) => {
          let resources = 0;
          let inhibitors = 0;
          const sectors: string[] = [];

          const scoresArray = (row.all_scores || []) as any[];

          scoresArray.forEach((scored: any) => {
            if (!scored) return;

            // 1. Resources: Interests + Aptitudes
            if (scored.interests && Array.isArray(scored.interests)) {
              resources += scored.interests.length;
              scored.interests.forEach((s: string) => {
                if (!sectors.includes(s)) sectors.push(s);
              });
            }

            if (scored.aptitudes && Array.isArray(scored.aptitudes)) {
              resources += scored.aptitudes.reduce(
                (sum: number, a: any) => sum + (a.score || 0),
                0,
              );
            }

            // 2. Inhibitors: Barriers weighted by severity
            if (scored.barriers && Array.isArray(scored.barriers)) {
              scored.barriers.forEach((b: any) => {
                const weight =
                  b.severity === 'high' ? 3 : b.severity === 'medium' ? 2 : 1;
                inhibitors += weight;
              });
            }
          });

          const enrollmentDate = new Date(row.created_at);
          const now = new Date();
          const weeksInProgram = Math.max(
            1,
            Math.ceil(
              (now.getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24 * 7),
            ),
          );

          return {
            participantId: row.participant_id,
            enrollmentDate: row.created_at,
            outcome: row.status,
            score: resources - inhibitors,
            weeksInProgram,
            sectors,
            resources,
            inhibitors,
          };
        });
      },
    );
  }
}

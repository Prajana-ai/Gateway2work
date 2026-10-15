import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface IpsMetrics {
  competitiveEmploymentRate: {
    hired: number;
    totalActive: number;
    rate: number;
  };
  timeToFirstEmployment: {
    averageDays: number;
    medianDays: number;
  };
  jobRetentionRate: {
    retainedAt90Days: number;
    totalHired: number;
    rate: number;
  };
  employmentHoursPerWeek: {
    averageHours: number;
    participantsTracked: number;
  };
  vocationalServiceIntegration: {
    participantsWithBoth: number;
    totalParticipants: number;
    rate: number;
  };
  participantChoiceIndicators: {
    participantSelected: number;
    totalMatches: number;
    rate: number;
  };
}

export interface WorkRequirementReadiness {
  hoursWorkedPerMonth: Array<{
    participant_id: string;
    month: string;
    hours_worked: number;
    meets_threshold: boolean;
  }>;
  participantsMeetingThreshold: number;
  participantsBelowThreshold: number;
  gapAnalysis: Array<{
    participant_id: string;
    avg_monthly_hours: number;
    hours_gap: number;
  }>;
  projectedComplianceRate: number;
  totalTrackedParticipants: number;
}

@Injectable()
export class IpsMetricsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getIpsMetrics(
    tenantId: string,
    userId: string,
    role: string,
  ): Promise<IpsMetrics> {
    return this.databaseService.executeInTenantContext(
      tenantId,
      userId,
      role,
      async (participant) => {
        const [
          employmentResult,
          timeToEmploymentResult,
          retentionResult,
          hoursResult,
          integrationResult,
          choiceResult,
        ] = await Promise.all([
          // Competitive employment rate: hired / total active participants
          participant.query(
            `SELECT
               (SELECT COUNT(*) FROM application.participant_employer_matches WHERE outcome = 'hired') AS hired,
               (SELECT COUNT(*) FROM application.participants WHERE status = 'active') AS total_active`,
          ),
          // Time to first employment: average days from referral to hired
          participant.query(
            `SELECT
               COALESCE(ROUND(AVG(days_to_hire), 1), 0) AS average_days,
               COALESCE(ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_hire)::numeric, 1), 0) AS median_days
             FROM (
               SELECT
                 EXTRACT(EPOCH FROM (m.updated_at - m.created_at)) / 86400 AS days_to_hire
               FROM application.participant_employer_matches m
               WHERE m.outcome = 'hired'
             ) sub`,
          ),
          // Job retention rate: participants still employed at 90 days (placeholder logic)
          participant.query(
            `SELECT
               COUNT(*) FILTER (
                 WHERE outcome = 'hired'
                   AND updated_at <= CURRENT_DATE - INTERVAL '90 days'
               ) AS retained_at_90_days,
               COUNT(*) FILTER (WHERE outcome = 'hired') AS total_hired
             FROM application.participant_employer_matches`,
          ),
          // Employment hours per week from encounter tracking
          participant.query(
            `SELECT
               COALESCE(ROUND(AVG(weekly_minutes / 60.0), 1), 0) AS average_hours,
               COUNT(DISTINCT participant_id) AS participants_tracked
             FROM (
               SELECT
                 participant_id,
                 SUM(duration_minutes) / GREATEST(
                   EXTRACT(EPOCH FROM (MAX(encounter_date) - MIN(encounter_date))) / 604800,
                   1
                 ) AS weekly_minutes
               FROM protected.encounters
               WHERE encounter_date >= CURRENT_DATE - INTERVAL '3 months'
               GROUP BY participant_id
             ) sub`,
          ),
          // Vocational service integration: % with both assessment + plan
          participant.query(
            `SELECT
               COUNT(DISTINCT c.id) FILTER (
                 WHERE a.id IS NOT NULL AND wp.id IS NOT NULL
               ) AS participants_with_both,
               COUNT(DISTINCT c.id) AS total_participants
             FROM application.participants c
             LEFT JOIN application.assessments a ON a.participant_id = c.id
             LEFT JOIN application.workforce_plans wp ON wp.participant_id = c.id
             WHERE c.status = 'active'`,
          ),
          // Participant choice indicators: % of matches where participant selected employer
          participant.query(
            `SELECT
               COUNT(*) FILTER (WHERE participant_selected = true) AS participant_selected,
               COUNT(*) AS total_matches
             FROM application.participant_employer_matches`,
          ),
        ]);

        const emp = employmentResult.rows[0];
        const time = timeToEmploymentResult.rows[0];
        const ret = retentionResult.rows[0];
        const hrs = hoursResult.rows[0];
        const integ = integrationResult.rows[0];
        const choice = choiceResult.rows[0];

        const hired = parseInt(emp.hired, 10);
        const totalActive = parseInt(emp.total_active, 10);
        const retainedAt90 = parseInt(ret.retained_at_90_days, 10);
        const totalHired = parseInt(ret.total_hired, 10);
        const participantsWithBoth = parseInt(integ.participants_with_both, 10);
        const totalParticipants = parseInt(integ.total_participants, 10);
        const participantSelected = parseInt(choice.participant_selected, 10);
        const totalMatches = parseInt(choice.total_matches, 10);

        return {
          competitiveEmploymentRate: {
            hired,
            totalActive,
            rate: totalActive > 0
              ? parseFloat(((hired / totalActive) * 100).toFixed(2))
              : 0,
          },
          timeToFirstEmployment: {
            averageDays: parseFloat(time.average_days),
            medianDays: parseFloat(time.median_days),
          },
          jobRetentionRate: {
            retainedAt90Days: retainedAt90,
            totalHired,
            rate: totalHired > 0
              ? parseFloat(((retainedAt90 / totalHired) * 100).toFixed(2))
              : 0,
          },
          employmentHoursPerWeek: {
            averageHours: parseFloat(hrs.average_hours),
            participantsTracked: parseInt(hrs.participants_tracked, 10),
          },
          vocationalServiceIntegration: {
            participantsWithBoth,
            totalParticipants,
            rate: totalParticipants > 0
              ? parseFloat(((participantsWithBoth / totalParticipants) * 100).toFixed(2))
              : 0,
          },
          participantChoiceIndicators: {
            participantSelected,
            totalMatches,
            rate: totalMatches > 0
              ? parseFloat(((participantSelected / totalMatches) * 100).toFixed(2))
              : 0,
          },
        };
      },
    );
  }

  async getWorkRequirementReadiness(
    tenantId: string,
    userId: string,
    role: string,
  ): Promise<WorkRequirementReadiness> {
    const TARGET_MONTHLY_HOURS = 80;

    return this.databaseService.executeInTenantContext(
      tenantId,
      userId,
      role,
      async (participant) => {
        // Hours worked per month per participant
        const monthlyHoursResult = await participant.query(
          `SELECT
             e.participant_id,
             TO_CHAR(e.encounter_date, 'YYYY-MM') AS month,
             ROUND(SUM(e.duration_minutes) / 60.0, 1) AS hours_worked
           FROM protected.encounters e
           WHERE e.encounter_date >= CURRENT_DATE - INTERVAL '6 months'
           GROUP BY e.participant_id, TO_CHAR(e.encounter_date, 'YYYY-MM')
           ORDER BY e.participant_id, month`,
        );

        const hoursWorkedPerMonth = monthlyHoursResult.rows.map((r) => ({
          participant_id: r.participant_id,
          month: r.month,
          hours_worked: parseFloat(r.hours_worked),
          meets_threshold: parseFloat(r.hours_worked) >= TARGET_MONTHLY_HOURS,
        }));

        // Gap analysis: average monthly hours per participant
        const gapResult = await participant.query(
          `SELECT
             sub.participant_id,
             ROUND(AVG(sub.monthly_hours), 1) AS avg_monthly_hours,
             GREATEST(0, ROUND($1 - AVG(sub.monthly_hours), 1)) AS hours_gap
           FROM (
             SELECT
               e.participant_id,
               TO_CHAR(e.encounter_date, 'YYYY-MM') AS month,
               SUM(e.duration_minutes) / 60.0 AS monthly_hours
             FROM protected.encounters e
             WHERE e.encounter_date >= CURRENT_DATE - INTERVAL '3 months'
             GROUP BY e.participant_id, TO_CHAR(e.encounter_date, 'YYYY-MM')
           ) sub
           GROUP BY sub.participant_id
           HAVING AVG(sub.monthly_hours) < $1
           ORDER BY hours_gap DESC`,
          [TARGET_MONTHLY_HOURS],
        );

        const gapAnalysis = gapResult.rows.map((r) => ({
          participant_id: r.participant_id,
          avg_monthly_hours: parseFloat(r.avg_monthly_hours),
          hours_gap: parseFloat(r.hours_gap),
        }));

        // Compliance summary
        const complianceResult = await participant.query(
          `SELECT
             COUNT(DISTINCT sub.participant_id) FILTER (
               WHERE sub.avg_hours >= $1
             ) AS meeting_threshold,
             COUNT(DISTINCT sub.participant_id) FILTER (
               WHERE sub.avg_hours < $1
             ) AS below_threshold,
             COUNT(DISTINCT sub.participant_id) AS total_tracked
           FROM (
             SELECT
               e.participant_id,
               AVG(monthly.monthly_hours) AS avg_hours
             FROM (
               SELECT
                 participant_id,
                 TO_CHAR(encounter_date, 'YYYY-MM') AS month,
                 SUM(duration_minutes) / 60.0 AS monthly_hours
               FROM protected.encounters
               WHERE encounter_date >= CURRENT_DATE - INTERVAL '3 months'
               GROUP BY participant_id, TO_CHAR(encounter_date, 'YYYY-MM')
             ) monthly
             JOIN protected.encounters e ON e.participant_id = monthly.participant_id
             GROUP BY e.participant_id
           ) sub`,
          [TARGET_MONTHLY_HOURS],
        );

        const compliance = complianceResult.rows[0];
        const meetingThreshold = parseInt(compliance.meeting_threshold, 10);
        const belowThreshold = parseInt(compliance.below_threshold, 10);
        const totalTracked = parseInt(compliance.total_tracked, 10);

        return {
          hoursWorkedPerMonth,
          participantsMeetingThreshold: meetingThreshold,
          participantsBelowThreshold: belowThreshold,
          gapAnalysis,
          projectedComplianceRate:
            totalTracked > 0
              ? parseFloat(
                  ((meetingThreshold / totalTracked) * 100).toFixed(2),
                )
              : 0,
          totalTrackedParticipants: totalTracked,
        };
      },
    );
  }
}

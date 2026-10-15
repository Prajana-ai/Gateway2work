import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

export interface ConversationalReportResult {
  query: string;
  answer: string;
  data: Record<string, any>[];
  chartType?: 'bar' | 'pie' | 'table' | 'number';
  metadata: {
    queryPattern: string;
    rowCount: number;
    executionMs: number;
  };
}

interface QueryTemplate {
  pattern: RegExp;
  name: string;
  buildQuery: () => { sql: string; params: any[] };
  formatAnswer: (rows: Record<string, any>[]) => string;
  chartType: 'bar' | 'pie' | 'table' | 'number';
}

@Injectable()
export class AiReportsService {
  private readonly templates: QueryTemplate[];

  constructor(private readonly databaseService: DatabaseService) {
    this.templates = this.buildTemplates();
  }

  async query(
    tenantId: string,
    userId: string,
    role: string,
    question: string,
  ): Promise<ConversationalReportResult> {
    const normalizedQuestion = question.toLowerCase().trim();
    const template = this.findTemplate(normalizedQuestion);

    if (!template) {
      return {
        query: question,
        answer:
          "I can help with placement rates, assessment completion, participant counts, encounters, barriers analysis, interests, plan progress, and referral statistics. Try asking something like \"Show me placement rates by sector\" or \"How many active participants do we have?\"",
        data: [],
        chartType: 'table',
        metadata: {
          queryPattern: 'unsupported',
          rowCount: 0,
          executionMs: 0,
        },
      };
    }

    const { sql, params } = template.buildQuery();
    const startTime = Date.now();

    const rows = await this.databaseService.executeInTenantContext(
      tenantId,
      userId,
      role,
      async (participant) => {
        const result = await participant.query(sql, params);
        return result.rows;
      },
    );

    const executionMs = Date.now() - startTime;

    return {
      query: question,
      answer: template.formatAnswer(rows),
      data: rows,
      chartType: template.chartType,
      metadata: {
        queryPattern: template.name,
        rowCount: rows.length,
        executionMs,
      },
    };
  }

  private findTemplate(question: string): QueryTemplate | null {
    for (const template of this.templates) {
      if (template.pattern.test(question)) {
        return template;
      }
    }
    return null;
  }

  private buildTemplates(): QueryTemplate[] {
    return [
      // Placement rate by sector
      {
        pattern: /placement.*(by\s+sector|sector)/,
        name: 'placement_by_sector',
        buildQuery: () => ({
          sql: `SELECT
                  COALESCE(sector, 'Unknown') AS sector,
                  COUNT(*) AS total_matches,
                  COUNT(*) FILTER (WHERE outcome = 'hired') AS total_hired,
                  CASE
                    WHEN COUNT(*) > 0
                    THEN ROUND(
                      (COUNT(*) FILTER (WHERE outcome = 'hired')::numeric / COUNT(*)::numeric) * 100,
                      2
                    )
                    ELSE 0
                  END AS placement_rate
                FROM application.participant_employer_matches
                GROUP BY COALESCE(sector, 'Unknown')
                ORDER BY placement_rate DESC`,
          params: [],
        }),
        formatAnswer: (rows) => {
          if (rows.length === 0) return 'No placement data found.';
          const lines = rows.map(
            (r) =>
              `${r.sector}: ${r.placement_rate}% (${r.total_hired}/${r.total_matches})`,
          );
          return `Placement rates by sector:\n${lines.join('\n')}`;
        },
        chartType: 'bar',
      },
      // Placement rate (overall)
      {
        pattern: /placement\s*rate/,
        name: 'placement_rate',
        buildQuery: () => ({
          sql: `SELECT
                  COUNT(*) AS total_matches,
                  COUNT(*) FILTER (WHERE outcome = 'hired') AS total_hired,
                  CASE
                    WHEN COUNT(*) > 0
                    THEN ROUND(
                      (COUNT(*) FILTER (WHERE outcome = 'hired')::numeric / COUNT(*)::numeric) * 100,
                      2
                    )
                    ELSE 0
                  END AS placement_rate,
                  COALESCE(
                    ROUND(AVG(
                      EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400
                    ) FILTER (WHERE outcome = 'hired'), 1),
                    0
                  ) AS avg_days_to_placement
                FROM application.participant_employer_matches`,
          params: [],
        }),
        formatAnswer: (rows) => {
          if (rows.length === 0) return 'No placement data found.';
          const r = rows[0];
          return `Overall placement rate: ${r.placement_rate}% (${r.total_hired} hired out of ${r.total_matches} matches). Average time to placement: ${r.avg_days_to_placement} days.`;
        },
        chartType: 'number',
      },
      // Assessment completion
      {
        pattern: /assessment\s*(completion|status|complete)/,
        name: 'assessment_completion',
        buildQuery: () => ({
          sql: `SELECT
                  assessment_type,
                  status,
                  COUNT(*) AS count
                FROM application.assessments
                GROUP BY assessment_type, status
                ORDER BY assessment_type, status`,
          params: [],
        }),
        formatAnswer: (rows) => {
          if (rows.length === 0) return 'No assessment data found.';
          const lines = rows.map(
            (r) => `${r.assessment_type} (${r.status}): ${r.count}`,
          );
          return `Assessment completion breakdown:\n${lines.join('\n')}`;
        },
        chartType: 'bar',
      },
      // Active participants / participant count
      {
        pattern: /active\s*participant|participant\s*count|how\s*many\s*participant/,
        name: 'active_participants',
        buildQuery: () => ({
          sql: `SELECT
                  status,
                  COUNT(*) AS count
                FROM application.participants
                GROUP BY status
                ORDER BY count DESC`,
          params: [],
        }),
        formatAnswer: (rows) => {
          if (rows.length === 0) return 'No participant data found.';
          const active = rows.find((r) => r.status === 'active');
          const total = rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0);
          const activeCount = active ? parseInt(active.count, 10) : 0;
          const lines = rows.map((r) => `${r.status}: ${r.count}`);
          return `Total participants: ${total}. Active: ${activeCount}.\n${lines.join('\n')}`;
        },
        chartType: 'pie',
      },
      // Encounters / billing
      {
        pattern: /encounter|billing/,
        name: 'encounters',
        buildQuery: () => ({
          sql: `SELECT
                  TO_CHAR(encounter_date, 'YYYY-MM') AS month,
                  COUNT(*) AS total_encounters,
                  COUNT(*) FILTER (WHERE billable = true) AS billable_encounters,
                  COALESCE(SUM(duration_minutes), 0) AS total_minutes,
                  COALESCE(SUM(duration_minutes) FILTER (WHERE billable = true), 0) AS billable_minutes
                FROM protected.encounters
                WHERE encounter_date >= CURRENT_DATE - INTERVAL '6 months'
                GROUP BY TO_CHAR(encounter_date, 'YYYY-MM')
                ORDER BY month DESC`,
          params: [],
        }),
        formatAnswer: (rows) => {
          if (rows.length === 0) return 'No encounter data found for the last 6 months.';
          const lines = rows.map(
            (r) =>
              `${r.month}: ${r.total_encounters} encounters (${r.billable_encounters} billable, ${r.total_minutes} total minutes)`,
          );
          return `Encounter summary (last 6 months):\n${lines.join('\n')}`;
        },
        chartType: 'bar',
      },
      // Barriers
      {
        pattern: /barrier|common\s*barrier/,
        name: 'barriers',
        buildQuery: () => ({
          sql: `SELECT
                  b.value->>'name' AS barrier_name,
                  b.value->>'severity' AS severity,
                  COUNT(*) AS occurrences
                FROM application.assessment_summaries s,
                     jsonb_array_elements(s.barriers) AS b(value)
                GROUP BY b.value->>'name', b.value->>'severity'
                ORDER BY occurrences DESC
                LIMIT 20`,
          params: [],
        }),
        formatAnswer: (rows) => {
          if (rows.length === 0) return 'No barrier data found.';
          const lines = rows.map(
            (r) =>
              `${r.barrier_name} (severity: ${r.severity}): ${r.occurrences} occurrences`,
          );
          return `Most common barriers:\n${lines.join('\n')}`;
        },
        chartType: 'bar',
      },
      // Interests
      {
        pattern: /interest|top\s*interest/,
        name: 'interests',
        buildQuery: () => ({
          sql: `SELECT
                  i.value::text AS interest,
                  COUNT(*) AS occurrences
                FROM application.assessment_summaries s,
                     jsonb_array_elements(s.interests) AS i(value)
                GROUP BY i.value::text
                ORDER BY occurrences DESC
                LIMIT 20`,
          params: [],
        }),
        formatAnswer: (rows) => {
          if (rows.length === 0) return 'No interest data found.';
          const lines = rows.map(
            (r) => `${r.interest}: ${r.occurrences} participants`,
          );
          return `Top interests:\n${lines.join('\n')}`;
        },
        chartType: 'bar',
      },
      // Plan progress / task completion
      {
        pattern: /plan\s*progress|task\s*completion/,
        name: 'plan_progress',
        buildQuery: () => ({
          sql: `SELECT
                  wp.status AS plan_status,
                  COUNT(DISTINCT wp.id) AS plan_count,
                  COUNT(t.id) AS total_tasks,
                  COUNT(t.id) FILTER (WHERE t.status = 'completed') AS completed_tasks,
                  CASE
                    WHEN COUNT(t.id) > 0
                    THEN ROUND(
                      (COUNT(t.id) FILTER (WHERE t.status = 'completed')::numeric / COUNT(t.id)::numeric) * 100,
                      2
                    )
                    ELSE 0
                  END AS task_completion_rate
                FROM application.workforce_plans wp
                LEFT JOIN application.workforce_plan_tasks t ON t.plan_id = wp.id
                GROUP BY wp.status
                ORDER BY plan_count DESC`,
          params: [],
        }),
        formatAnswer: (rows) => {
          if (rows.length === 0) return 'No workforce plan data found.';
          const totalPlans = rows.reduce(
            (sum, r) => sum + parseInt(r.plan_count, 10),
            0,
          );
          const totalTasks = rows.reduce(
            (sum, r) => sum + parseInt(r.total_tasks, 10),
            0,
          );
          const completedTasks = rows.reduce(
            (sum, r) => sum + parseInt(r.completed_tasks, 10),
            0,
          );
          const overallRate =
            totalTasks > 0
              ? ((completedTasks / totalTasks) * 100).toFixed(1)
              : '0';
          const lines = rows.map(
            (r) =>
              `${r.plan_status}: ${r.plan_count} plans, ${r.completed_tasks}/${r.total_tasks} tasks completed (${r.task_completion_rate}%)`,
          );
          return `Workforce plans: ${totalPlans} total. Overall task completion: ${overallRate}%.\n${lines.join('\n')}`;
        },
        chartType: 'table',
      },
      // Referral source
      {
        pattern: /referral|referral\s*source/,
        name: 'referral_source',
        buildQuery: () => ({
          sql: `SELECT
                  COALESCE(referral_source, 'Unknown') AS referral_source,
                  COUNT(*) AS total_referrals,
                  COUNT(*) FILTER (WHERE referral_status = 'accepted') AS accepted,
                  COUNT(*) FILTER (WHERE referral_status = 'pending') AS pending,
                  COUNT(*) FILTER (WHERE referral_status = 'declined') AS declined
                FROM protected.referrals
                GROUP BY COALESCE(referral_source, 'Unknown')
                ORDER BY total_referrals DESC`,
          params: [],
        }),
        formatAnswer: (rows) => {
          if (rows.length === 0) return 'No referral data found.';
          const total = rows.reduce(
            (sum, r) => sum + parseInt(r.total_referrals, 10),
            0,
          );
          const lines = rows.map(
            (r) =>
              `${r.referral_source}: ${r.total_referrals} referrals (${r.accepted} accepted, ${r.pending} pending, ${r.declined} declined)`,
          );
          return `Total referrals: ${total}.\n${lines.join('\n')}`;
        },
        chartType: 'bar',
      },
    ];
  }
}

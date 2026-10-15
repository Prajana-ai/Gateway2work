import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { TenantAwareRepository } from '../../common/database/tenant-aware.repository';
import { DatabaseService } from '../../database/database.service';

export interface AssessmentRecord {
  id: string;
  tenant_id: string;
  participant_id: string;
  assessment_type: string;
  raw_responses: Record<string, any>;
  computed_summary: Record<string, any>;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
}

export interface AssessmentSummaryRecord {
  id: string;
  tenant_id: string;
  participant_id: string;
  assessment_id: string;
  assessment_type: string;
  scores: Record<string, any>;
  computed_at: string;
}

@Injectable()
export class AssessmentsRepository extends TenantAwareRepository {
  constructor(databaseService: DatabaseService) {
    super(databaseService);
  }

  async findByParticipantId(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<AssessmentRecord[]> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT id, tenant_id, participant_id, assessment_type,
                computed_summary, completed_at, completed_by, created_at
         FROM protected.assessments
         WHERE participant_id = $1
         ORDER BY created_at DESC`,
        [participantId],
      );
      return result.rows;
    });
  }

  async findById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<AssessmentRecord | null> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT id, tenant_id, participant_id, assessment_type,
                raw_responses, computed_summary,
                completed_at, completed_by, created_at
         FROM protected.assessments
         WHERE id = $1`,
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
      participantId: string;
      assessmentType: string;
      rawResponses: Record<string, any>;
      computedSummary: Record<string, any>;
    },
  ): Promise<{ assessment: AssessmentRecord; summary: AssessmentSummaryRecord }> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      // Insert into protected.assessments
      const assessmentResult = await client.query(
        `INSERT INTO protected.assessments (
          tenant_id, participant_id, assessment_type,
          raw_responses, computed_summary,
          completed_at, completed_by
        ) VALUES ($1, $2, $3, $4, $5, NOW(), $6)
        RETURNING *`,
        [
          tenantId,
          data.participantId,
          data.assessmentType,
          JSON.stringify(data.rawResponses),
          JSON.stringify(data.computedSummary),
          userId,
        ],
      );

      const assessment = assessmentResult.rows[0];

      // Insert de-identified summary into application.assessment_summaries
      // within the SAME transaction (guaranteed by TenantAwareRepository)
      const summaryResult = await client.query(
        `INSERT INTO application.assessment_summaries (
          tenant_id, participant_id, assessment_id, assessment_type,
          scores, computed_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *`,
        [
          tenantId,
          data.participantId,
          assessment.id,
          data.assessmentType,
          JSON.stringify(data.computedSummary),
        ],
      );

      return {
        assessment,
        summary: summaryResult.rows[0],
      };
    });
  }

  async getSummariesByParticipant(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<AssessmentSummaryRecord[]> {
    return this.execute(tenantId, userId, role, async (client: PoolClient) => {
      const result = await client.query(
        `SELECT id, tenant_id, participant_id, assessment_id,
                assessment_type, scores, computed_at
         FROM application.assessment_summaries
         WHERE participant_id = $1
         ORDER BY computed_at DESC`,
        [participantId],
      );
      return result.rows;
    });
  }
}

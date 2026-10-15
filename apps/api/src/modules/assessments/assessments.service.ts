import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  AssessmentsRepository,
  AssessmentRecord,
  AssessmentSummaryRecord,
} from './assessments.repository';
import { ScoringService, isValidAssessmentType, ScoredResult } from './scoring/scoring.service';

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly assessmentsRepository: AssessmentsRepository,
    private readonly scoringService: ScoringService,
  ) {}

  async listByParticipant(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<AssessmentRecord[]> {
    return this.assessmentsRepository.findByParticipantId(
      tenantId,
      userId,
      role,
      participantId,
    );
  }

  async getById(
    tenantId: string,
    userId: string,
    role: string,
    id: string,
  ): Promise<AssessmentRecord> {
    const assessment = await this.assessmentsRepository.findById(
      tenantId,
      userId,
      role,
      id,
    );
    if (!assessment) {
      throw new NotFoundException(`Assessment with id ${id} not found`);
    }
    return assessment;
  }

  async submit(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
    assessmentType: string,
    responses: Record<string, any>,
  ): Promise<{ assessment: AssessmentRecord; summary: AssessmentSummaryRecord; scored: ScoredResult }> {
    // 1. Validate assessment type
    if (!isValidAssessmentType(assessmentType)) {
      throw new BadRequestException(
        `Invalid assessment type: ${assessmentType}. Must be one of: current_work_profile, workstyle_strengths, support_needs`,
      );
    }

    // 2. Run scoring engine to compute summary
    const scored = this.scoringService.score(assessmentType, responses);

    // 3. Create assessment record + summary in one transaction via repository
    const { assessment, summary } = await this.assessmentsRepository.create(
      tenantId,
      userId,
      role,
      {
        participantId,
        assessmentType,
        rawResponses: responses,
        computedSummary: scored,
      },
    );

    // 4. Return the computed summary alongside the records
    return { assessment, summary, scored };
  }

  async getSummaries(
    tenantId: string,
    userId: string,
    role: string,
    participantId: string,
  ): Promise<AssessmentSummaryRecord[]> {
    return this.assessmentsRepository.getSummariesByParticipant(
      tenantId,
      userId,
      role,
      participantId,
    );
  }
}

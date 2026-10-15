import { Injectable, BadRequestException } from '@nestjs/common';
import { CurrentWorkProfileScorer } from './current-work-profile.scorer';
import { WorkstyleStrengthsScorer } from './workstyle-strengths.scorer';
import { SupportNeedsScorer } from './support-needs.scorer';

export interface ScoredResult {
  interests: string[];
  aptitudes: { category: string; level: string; score: number }[];
  barriers: { category: string; severity: 'low' | 'medium' | 'high'; details: string }[];
  overallReadiness: 'not_ready' | 'developing' | 'ready' | 'highly_ready';
  recommendations: string[];
}

const VALID_ASSESSMENT_TYPES = ['current_work_profile', 'workstyle_strengths', 'support_needs'] as const;
export type AssessmentType = (typeof VALID_ASSESSMENT_TYPES)[number];

export function isValidAssessmentType(type: string): type is AssessmentType {
  return VALID_ASSESSMENT_TYPES.includes(type as AssessmentType);
}

@Injectable()
export class ScoringService {
  constructor(
    private readonly currentWorkProfileScorer: CurrentWorkProfileScorer,
    private readonly workstyleStrengthsScorer: WorkstyleStrengthsScorer,
    private readonly supportNeedsScorer: SupportNeedsScorer,
  ) {}

  score(assessmentType: string, rawResponses: Record<string, any>): ScoredResult {
    switch (assessmentType) {
      case 'current_work_profile':
        return this.currentWorkProfileScorer.score(rawResponses);
      case 'workstyle_strengths':
        return this.workstyleStrengthsScorer.score(rawResponses);
      case 'support_needs':
        return this.supportNeedsScorer.score(rawResponses);
      default:
        throw new BadRequestException(
          `Unknown assessment type: ${assessmentType}. Valid types: ${VALID_ASSESSMENT_TYPES.join(', ')}`,
        );
    }
  }
}

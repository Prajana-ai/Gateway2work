import { Module } from '@nestjs/common';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { AssessmentsRepository } from './assessments.repository';
import { ScoringService } from './scoring/scoring.service';
import { CurrentWorkProfileScorer } from './scoring/current-work-profile.scorer';
import { WorkstyleStrengthsScorer } from './scoring/workstyle-strengths.scorer';
import { SupportNeedsScorer } from './scoring/support-needs.scorer';

@Module({
  controllers: [AssessmentsController],
  providers: [
    AssessmentsService,
    AssessmentsRepository,
    ScoringService,
    CurrentWorkProfileScorer,
    WorkstyleStrengthsScorer,
    SupportNeedsScorer,
  ],
  exports: [AssessmentsService, ScoringService],
})
export class AssessmentsModule {}

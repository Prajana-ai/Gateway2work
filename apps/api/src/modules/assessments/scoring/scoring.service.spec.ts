import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ScoringService, ScoredResult } from './scoring.service';
import { CurrentWorkProfileScorer } from './current-work-profile.scorer';
import { WorkstyleStrengthsScorer } from './workstyle-strengths.scorer';
import { SupportNeedsScorer } from './support-needs.scorer';

describe('ScoringService', () => {
  let service: ScoringService;
  let currentWorkProfileScorer: CurrentWorkProfileScorer;
  let workstyleStrengthsScorer: WorkstyleStrengthsScorer;
  let supportNeedsScorer: SupportNeedsScorer;

  const mockResult: ScoredResult = {
    interests: [],
    aptitudes: [],
    barriers: [],
    overallReadiness: 'ready',
    recommendations: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoringService,
        {
          provide: CurrentWorkProfileScorer,
          useValue: { score: jest.fn().mockReturnValue({ ...mockResult, aptitudes: [{ category: 'Digital Literacy', level: 'basic', score: 1.2 }] }) },
        },
        {
          provide: WorkstyleStrengthsScorer,
          useValue: { score: jest.fn().mockReturnValue({ ...mockResult, interests: ['Realistic (Doers)'] }) },
        },
        {
          provide: SupportNeedsScorer,
          useValue: { score: jest.fn().mockReturnValue({ ...mockResult, barriers: [{ category: 'Housing', severity: 'low', details: 'Stable' }] }) },
        },
      ],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
    currentWorkProfileScorer = module.get<CurrentWorkProfileScorer>(CurrentWorkProfileScorer);
    workstyleStrengthsScorer = module.get<WorkstyleStrengthsScorer>(WorkstyleStrengthsScorer);
    supportNeedsScorer = module.get<SupportNeedsScorer>(SupportNeedsScorer);
  });

  it('should dispatch to skills scorer for current_work_profile', () => {
    const input = { education: {} };
    service.score('current_work_profile', input);
    expect(currentWorkProfileScorer.score).toHaveBeenCalledWith(input);
  });

  it('should dispatch to interests scorer for workstyle_strengths', () => {
    const input = { riasec: {} };
    service.score('workstyle_strengths', input);
    expect(workstyleStrengthsScorer.score).toHaveBeenCalledWith(input);
  });

  it('should dispatch to barriers scorer for support_needs', () => {
    const input = { housing: {} };
    service.score('support_needs', input);
    expect(supportNeedsScorer.score).toHaveBeenCalledWith(input);
  });

  it('should throw BadRequestException for unknown assessment type', () => {
    expect(() => service.score('unknown_type', {})).toThrow(BadRequestException);
    expect(() => service.score('unknown_type', {})).toThrow(/Unknown assessment type/);
  });

  it('should return a result with the ScoredResult shape', () => {
    const result = service.score('current_work_profile', {});
    expect(result).toHaveProperty('interests');
    expect(result).toHaveProperty('aptitudes');
    expect(result).toHaveProperty('barriers');
    expect(result).toHaveProperty('overallReadiness');
    expect(result).toHaveProperty('recommendations');
    expect(Array.isArray(result.interests)).toBe(true);
    expect(Array.isArray(result.aptitudes)).toBe(true);
    expect(Array.isArray(result.barriers)).toBe(true);
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(['not_ready', 'developing', 'ready', 'highly_ready']).toContain(result.overallReadiness);
  });
});

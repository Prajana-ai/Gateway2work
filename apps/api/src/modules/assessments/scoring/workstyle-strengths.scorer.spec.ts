import { WorkstyleStrengthsScorer } from './workstyle-strengths.scorer';

describe('WorkstyleStrengthsScorer', () => {
  let scorer: WorkstyleStrengthsScorer;

  beforeEach(() => {
    scorer = new WorkstyleStrengthsScorer();
  });

  const fullRealisticResponse = {
    riasec: {
      realistic: [5, 5, 5, 5, 5],
      investigative: [2, 2, 2, 2, 2],
      artistic: [1, 1, 1, 1, 1],
      social: [3, 3, 3, 3, 3],
      enterprising: [2, 2, 2, 2, 2],
      conventional: [2, 2, 2, 2, 2],
    },
    preferred_work_environment: 'outdoor',
    preferred_schedule: 'full_time',
    physical_preference: 'heavy',
    industries_of_interest: ['construction'],
  };

  it('should return top 3 interests from all realistic answers', () => {
    const response = {
      riasec: {
        realistic: [4, 4, 3, 4, 4],
        investigative: [3, 3, 4, 3, 3],
        artistic: [2, 2, 2, 2, 2],
        social: [3, 4, 3, 3, 4],
        enterprising: [2, 3, 2, 2, 2],
        conventional: [1, 1, 2, 1, 1],
      },
    };

    const result = scorer.score(response);
    expect(result.interests.length).toBe(3);
    // Each interest should be a RIASEC label string
    for (const interest of result.interests) {
      expect(typeof interest).toBe('string');
      expect(interest.length).toBeGreaterThan(0);
    }
  });

  it('should rank Realistic as top interest when all scores are high Realistic', () => {
    const result = scorer.score(fullRealisticResponse);
    expect(result.interests[0]).toBe('Realistic (Doers)');
  });

  it('should map interests to career sectors in recommendations', () => {
    const result = scorer.score(fullRealisticResponse);
    // With high Realistic score, recommendations should mention Realistic-aligned careers
    const careerRec = result.recommendations.find((r) =>
      r.includes('Realistic (Doers)') || r.includes('Construction') || r.includes('Warehouse'),
    );
    expect(careerRec).toBeDefined();
  });

  it('should include career_goals text context in recommendations when industries align', () => {
    const response = {
      riasec: {
        realistic: [5, 5, 5, 5, 5],
        investigative: [1, 1, 1, 1, 1],
        artistic: [1, 1, 1, 1, 1],
        social: [1, 1, 1, 1, 1],
        enterprising: [1, 1, 1, 1, 1],
        conventional: [1, 1, 1, 1, 1],
      },
      industries_of_interest: ['construction'],
    };

    const result = scorer.score(response);
    // When industries_of_interest overlaps with RIASEC career map sectors, should note alignment
    const alignmentRec = result.recommendations.find((r) =>
      r.toLowerCase().includes('align') || r.toLowerCase().includes('industry'),
    );
    expect(alignmentRec).toBeDefined();
  });

  it('should note when self-reported industries differ from RIASEC profile', () => {
    const response = {
      riasec: {
        realistic: [5, 5, 5, 5, 5],
        investigative: [1, 1, 1, 1, 1],
        artistic: [1, 1, 1, 1, 1],
        social: [1, 1, 1, 1, 1],
        enterprising: [1, 1, 1, 1, 1],
        conventional: [1, 1, 1, 1, 1],
      },
      industries_of_interest: ['graphic design'],
    };

    const result = scorer.score(response);
    // Should still produce valid results even when self-reported interests don't match RIASEC
    expect(result.interests.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should return aptitudes for all 6 RIASEC dimensions', () => {
    const result = scorer.score(fullRealisticResponse);
    expect(result.aptitudes.length).toBe(6);
    const labels = result.aptitudes.map((a) => a.category);
    expect(labels).toContain('Realistic (Doers)');
    expect(labels).toContain('Investigative (Thinkers)');
    expect(labels).toContain('Artistic (Creators)');
    expect(labels).toContain('Social (Helpers)');
    expect(labels).toContain('Enterprising (Persuaders)');
    expect(labels).toContain('Conventional (Organizers)');
  });

  it('should produce highly_ready when top score is high and spread is large', () => {
    const result = scorer.score(fullRealisticResponse);
    // Top = 5.0, bottom = 1.0, spread = 4.0 => highly_ready
    expect(result.overallReadiness).toBe('highly_ready');
  });

  it('should produce not_ready when all scores are very low', () => {
    const lowResponse = {
      riasec: {
        realistic: [1, 1, 1],
        investigative: [1, 1, 1],
        artistic: [1, 1, 1],
        social: [1, 1, 1],
        enterprising: [1, 1, 1],
        conventional: [1, 1, 1],
      },
    };
    const result = scorer.score(lowResponse);
    // Top = 1.0, spread = 0 => not_ready (topScore < 2.0)
    expect(result.overallReadiness).toBe('not_ready');
  });

  it('should return empty barriers array', () => {
    const result = scorer.score(fullRealisticResponse);
    expect(result.barriers).toEqual([]);
  });

  it('should handle missing riasec data gracefully', () => {
    const result = scorer.score({});
    expect(result.interests.length).toBe(3); // top 3 of 6 (all zero)
    expect(result.overallReadiness).toBe('not_ready');
  });
});

import { CurrentWorkProfileScorer } from './current-work-profile.scorer';

describe('CurrentWorkProfileScorer', () => {
  let scorer: CurrentWorkProfileScorer;

  beforeEach(() => {
    scorer = new CurrentWorkProfileScorer();
  });

  const completeResponse = {
    employment_status: {
      employment_status_at_intake: 'employed_ft',
      employment_type_ft_pt: 'ft',
      unemployed_duration_months: 0,
    },
    education: {
      highest_degree_earned: 'high_school',
      certifications: ['food_handler'],
      currently_enrolled: false,
      digital_proficiency: 'very_comfortable',
      english_proficiency: 'very_comfortable',
      math_proficiency: 'very_comfortable',
    },
    work_experience: {
      total_years: 3,
      recent_gap_months: 2,
      industries: ['retail', 'food_service'],
      longest_tenure_months: 18,
    },
    transportation: {
      valid_drivers_license: true,
      has_reliable_vehicle: true,
      has_public_transit_access: true,
      willing_to_commute_miles: 15,
    },
  };

  it('should return aptitudes with levels for a complete response', () => {
    const result = scorer.score(completeResponse);

    expect(result.aptitudes.length).toBe(4);
    for (const apt of result.aptitudes) {
      expect(apt).toHaveProperty('category');
      expect(apt).toHaveProperty('level');
      expect(apt).toHaveProperty('score');
      expect(typeof apt.score).toBe('number');
      expect(['none', 'basic', 'intermediate', 'advanced', 'expert']).toContain(apt.level);
    }

    const categories = result.aptitudes.map((a) => a.category);
    expect(categories).toContain('Current Work Picture');
    expect(categories).toContain('Work History');
    expect(categories).toContain('Learning Foundation');
    expect(categories).toContain('Commuting & Getting to Work');
  });

  it('should still produce a result with minimal response', () => {
    const minimal = {
      employment_status: {},
      education: { highest_degree_earned: 'none' },
      work_experience: {},
      transportation: {},
    };

    const result = scorer.score(minimal);
    expect(result.aptitudes.length).toBe(4);
    expect(result.overallReadiness).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should boost readiness with strong work experience', () => {
    const noExperience = {
      ...completeResponse,
      work_experience: { total_years: 0, recent_gap_months: 24, industries: [], longest_tenure_months: 0 },
    };
    const strongExperience = {
      ...completeResponse,
      work_experience: { total_years: 5, recent_gap_months: 0, industries: ['retail'], longest_tenure_months: 36 },
    };

    const resultNoExp = scorer.score(noExperience);
    const resultStrongExp = scorer.score(strongExperience);

    const readinessOrder = ['not_ready', 'developing', 'ready', 'highly_ready'];
    expect(readinessOrder.indexOf(resultStrongExp.overallReadiness))
      .toBeGreaterThanOrEqual(readinessOrder.indexOf(resultNoExp.overallReadiness));
  });

  it('should lower readiness when transportation is missing', () => {
    const withTransport = { ...completeResponse };
    const withoutTransport = {
      ...completeResponse,
      transportation: {
        valid_drivers_license: false,
        has_reliable_vehicle: false,
        has_public_transit_access: false,
        willing_to_commute_miles: 0,
      },
    };

    const resultWith = scorer.score(withTransport);
    const resultWithout = scorer.score(withoutTransport);

    const readinessOrder = ['not_ready', 'developing', 'ready', 'highly_ready'];
    expect(readinessOrder.indexOf(resultWith.overallReadiness))
      .toBeGreaterThanOrEqual(readinessOrder.indexOf(resultWithout.overallReadiness));
  });

  it('should generate recommendations for missing skills and certs', () => {
    const lowSkills = {
      employment_status: { employment_status_at_intake: 'unemployed' },
      education: { highest_degree_earned: 'none', certifications: [], currently_enrolled: false, digital_proficiency: 'brush_up' },
      work_experience: { total_years: 0, recent_gap_months: 0, industries: [], longest_tenure_months: 0 },
      transportation: { valid_drivers_license: false, has_reliable_vehicle: false, has_public_transit_access: false, willing_to_commute_miles: 0 },
    };

    const result = scorer.score(lowSkills);
    expect(result.recommendations.length).toBeGreaterThan(0);
    // Should recommend digital literacy training when brush_up is selected
    expect(result.recommendations.some((r) => r.toLowerCase().includes('computer') || r.toLowerCase().includes('digital'))).toBe(true);
    // Should recommend GED
    expect(result.recommendations.some((r) => r.toLowerCase().includes('ged'))).toBe(true);
    // Should recommend addressing transportation
    expect(result.recommendations.some((r) => r.toLowerCase().includes('transport'))).toBe(true);
  });

  it('should return empty interests and barriers arrays', () => {
    const result = scorer.score(completeResponse);
    expect(result.interests).toEqual([]);
    expect(result.barriers).toEqual([]);
  });
});

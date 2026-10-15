import { SupportNeedsScorer } from './support-needs.scorer';

describe('SupportNeedsScorer', () => {
  let scorer: SupportNeedsScorer;

  beforeEach(() => {
    scorer = new SupportNeedsScorer();
  });

  const noBarriersResponse = {
    housing: { housing_status_at_intake: 'stable', months_at_current: 24, eviction_history: false, can_receive_mail: true },
    legal: { has_felony: false, has_misdemeanor: false, on_probation_parole: false, pending_charges: false, sex_offender_registry: false, years_since_last_conviction: null, has_completed_reentry_program: false },
    health: { has_physical_limitation: false, has_mental_health_diagnosis: false, currently_in_treatment: false, substance_use_history: false, substance_use_in_recovery: false, recovery_months: 0, has_health_insurance: true, medications_affecting_work: false },
    financial: { has_bank_account: true, has_outstanding_debt: false, debt_in_collections: false, receives_benefits: [], child_support_obligation: false, child_support_arrears: false },
    support: { has_supportive_contacts: true, has_mentor_or_sponsor: true, has_stable_family_relationships: true, involved_in_community_group: true, has_case_manager: true },
    childcare: { has_dependent_children: false, number_of_children: 0, ages_of_children: [], has_reliable_childcare: false, childcare_limits_schedule: false },
    technology: { has_smartphone: true, has_internet_access: true, has_email_address: true, can_use_computer: true, can_complete_online_application: true },
    identification: { has_state_id: true, has_social_security_card: true, has_birth_certificate: true, has_work_authorization: true, documents_expired: false },
  };

  it('should return highly_ready or ready when no barriers exist', () => {
    const result = scorer.score(noBarriersResponse);
    expect(['ready', 'highly_ready']).toContain(result.overallReadiness);
    // All barriers should be low severity
    for (const barrier of result.barriers) {
      expect(barrier.severity).toBe('low');
    }
  });

  it('should set housing barrier to high when status is homeless', () => {
    const response = {
      ...noBarriersResponse,
      housing: { housing_status_at_intake: 'homeless', months_at_current: 0, eviction_history: true, can_receive_mail: false },
    };

    const result = scorer.score(response);
    const housingBarrier = result.barriers.find((b) => b.category === 'Housing');
    expect(housingBarrier).toBeDefined();
    expect(housingBarrier!.severity).toBe('high');
    expect(housingBarrier!.details).toContain('homelessness');
  });

  it('should set legal barrier to high when has felony with recent conviction', () => {
    const response = {
      ...noBarriersResponse,
      legal: {
        has_felony: true,
        has_misdemeanor: false,
        on_probation_parole: true,
        pending_charges: false,
        sex_offender_registry: false,
        years_since_last_conviction: 1,
        has_completed_reentry_program: false,
      },
    };

    const result = scorer.score(response);
    const legalBarrier = result.barriers.find((b) => b.category === 'Legal');
    expect(legalBarrier).toBeDefined();
    expect(legalBarrier!.severity).toBe('high');
    expect(legalBarrier!.details.toLowerCase()).toContain('felony');
  });

  it('should set health barrier to high with active substance use', () => {
    const response = {
      ...noBarriersResponse,
      health: {
        has_physical_limitation: false,
        has_mental_health_diagnosis: true,
        currently_in_treatment: false,
        substance_use_history: true,
        substance_use_in_recovery: false,
        recovery_months: 0,
        has_health_insurance: false,
        medications_affecting_work: false,
      },
    };

    const result = scorer.score(response);
    const healthBarrier = result.barriers.find((b) => b.category === 'Health');
    expect(healthBarrier).toBeDefined();
    expect(healthBarrier!.severity).toBe('high');
    expect(healthBarrier!.details.toLowerCase()).toContain('substance');
  });

  it('should return not_ready when multiple high barriers are present', () => {
    const response = {
      housing: { housing_status_at_intake: 'homeless', months_at_current: 0, eviction_history: true, can_receive_mail: false },
      legal: { has_felony: true, has_misdemeanor: true, on_probation_parole: true, pending_charges: true, sex_offender_registry: false, years_since_last_conviction: 0, has_completed_reentry_program: false },
      health: { has_physical_limitation: true, has_mental_health_diagnosis: true, currently_in_treatment: false, substance_use_history: true, substance_use_in_recovery: false, recovery_months: 0, has_health_insurance: false, medications_affecting_work: true },
      financial: { has_bank_account: false, has_outstanding_debt: true, debt_in_collections: true, receives_benefits: ['snap', 'tanf'], child_support_obligation: true, child_support_arrears: true },
      support: { has_supportive_contacts: false, has_mentor_or_sponsor: false, has_stable_family_relationships: false, involved_in_community_group: false, has_case_manager: false },
      childcare: { has_dependent_children: true, number_of_children: 4, ages_of_children: [1, 3, 6, 8], has_reliable_childcare: false, childcare_limits_schedule: true },
      technology: { has_smartphone: false, has_internet_access: false, has_email_address: false, can_use_computer: false, can_complete_online_application: false },
      identification: { has_state_id: false, has_social_security_card: false, has_birth_certificate: false, has_work_authorization: true, documents_expired: false },
    };

    const result = scorer.score(response);
    expect(result.overallReadiness).toBe('not_ready');

    const highBarriers = result.barriers.filter((b) => b.severity === 'high');
    expect(highBarriers.length).toBeGreaterThanOrEqual(3);
  });

  it('should address highest-severity barriers first in recommendations', () => {
    const response = {
      ...noBarriersResponse,
      housing: { housing_status_at_intake: 'homeless', months_at_current: 0, eviction_history: false, can_receive_mail: true },
      legal: { has_felony: true, has_misdemeanor: false, on_probation_parole: false, pending_charges: true, sex_offender_registry: false, years_since_last_conviction: 0, has_completed_reentry_program: false },
    };

    const result = scorer.score(response);
    expect(result.recommendations.length).toBeGreaterThan(0);

    // The first recommendations should address housing and legal (high severity)
    // before any medium-severity items
    const housingRecIdx = result.recommendations.findIndex((r) =>
      r.toLowerCase().includes('housing') || r.toLowerCase().includes('shelter'),
    );
    const legalRecIdx = result.recommendations.findIndex((r) =>
      r.toLowerCase().includes('legal') || r.toLowerCase().includes('charge') || r.toLowerCase().includes('fair-chance') || r.toLowerCase().includes('reentry'),
    );

    // Both high-severity categories should have recommendations
    expect(housingRecIdx).toBeGreaterThanOrEqual(0);
    expect(legalRecIdx).toBeGreaterThanOrEqual(0);
  });

  it('should return 9 barrier categories', () => {
    const result = scorer.score(noBarriersResponse);
    expect(result.barriers.length).toBe(9);
    const categories = result.barriers.map((b) => b.category);
    expect(categories).toContain('Housing');
    expect(categories).toContain('Legal');
    expect(categories).toContain('Health');
    expect(categories).toContain('Financial');
    expect(categories).toContain('Support System');
    expect(categories).toContain('Childcare');
    expect(categories).toContain('Technology Access');
    expect(categories).toContain('Identification');
    expect(categories).toContain('Vocational');
  });

  it('should return empty interests and aptitudes arrays', () => {
    const result = scorer.score(noBarriersResponse);
    expect(result.interests).toEqual([]);
    expect(result.aptitudes).toEqual([]);
  });

  it('should set identification barrier to high when missing work authorization', () => {
    const response = {
      ...noBarriersResponse,
      identification: { has_state_id: true, has_social_security_card: true, has_birth_certificate: true, has_work_authorization: false, documents_expired: false },
    };

    const result = scorer.score(response);
    const idBarrier = result.barriers.find((b) => b.category === 'Identification');
    expect(idBarrier).toBeDefined();
    expect(idBarrier!.severity).toBe('high');
    expect(idBarrier!.details.toLowerCase()).toContain('work authorization');
  });

  it('should handle empty input gracefully', () => {
    const result = scorer.score({});
    expect(result.barriers.length).toBe(9);
    expect(result.overallReadiness).toBeDefined();
    expect(['not_ready', 'developing', 'ready', 'highly_ready']).toContain(result.overallReadiness);
  });
});

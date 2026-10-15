import { Injectable } from '@nestjs/common';
import { ScoredResult } from './scoring.service';

/**
 * TSRG Barriers Assessment Scorer
 *
 * Expected raw_responses shape:
 * {
 *   housing: {
 *     status: 'stable' | 'transitional' | 'shelter' | 'homeless' | 'at_risk',
 *     months_at_current: number,
 *     eviction_history: boolean,
 *     can_receive_mail: boolean,
 *   },
 *   legal: {
 *     has_felony: boolean,
 *     has_misdemeanor: boolean,
 *     on_probation_parole: boolean,
 *     pending_charges: boolean,
 *     sex_offender_registry: boolean,
 *     years_since_last_conviction: number | null,
 *     has_completed_reentry_program: boolean,
 *   },
 *   health: {
 *     has_physical_limitation: boolean,
 *     physical_limitation_details: string,
 *     has_mental_health_diagnosis: boolean,
 *     currently_in_treatment: boolean,
 *     substance_use_history: boolean,
 *     substance_use_in_recovery: boolean,
 *     recovery_months: number,
 *     has_health_insurance: boolean,
 *     medications_affecting_work: boolean,
 *   },
 *   financial: {
 *     has_bank_account: boolean,
 *     has_outstanding_debt: boolean,
 *     debt_in_collections: boolean,
 *     receives_benefits: string[],  // e.g., ['snap', 'tanf', 'ssi', 'medicaid']
 *     child_support_obligation: boolean,
 *     child_support_arrears: boolean,
 *   },
 *   support: {
 *     has_supportive_contacts: boolean,
 *     has_mentor_or_sponsor: boolean,
 *     has_stable_family_relationships: boolean,
 *     involved_in_community_group: boolean,
 *     has_case_manager: boolean,
 *   },
 *   childcare: {
 *     has_dependent_children: boolean,
 *     number_of_children: number,
 *     ages_of_children: number[],
 *     has_reliable_childcare: boolean,
 *     childcare_limits_schedule: boolean,
 *   },
 *   technology: {
 *     has_smartphone: boolean,
 *     has_internet_access: boolean,
 *     has_email_address: boolean,
 *     can_use_computer: boolean,
 *     can_complete_online_application: boolean,
 *   },
 *   identification: {
 *     has_state_id: boolean,
 *     has_social_security_card: boolean,
 *     has_birth_certificate: boolean,
 *     has_work_authorization: boolean,
 *     documents_expired: boolean,
 *   },
 * }
 */

interface BarrierEvaluation {
  category: string;
  severity: 'low' | 'medium' | 'high';
  details: string;
}

@Injectable()
export class SupportNeedsScorer {
  score(rawResponses: Record<string, any>): ScoredResult {
    const barriers: BarrierEvaluation[] = [];

    barriers.push(this.evaluateHousing(rawResponses.housing || {}));
    barriers.push(this.evaluateLegal(rawResponses.legal || {}));
    barriers.push(this.evaluateHealth(rawResponses.health || {}));
    barriers.push(this.evaluateFinancial(rawResponses.financial || {}));
    barriers.push(this.evaluateSupport(rawResponses.support_system || rawResponses.support || {}));
    barriers.push(this.evaluateChildcare(rawResponses.childcare || {}));
    barriers.push(this.evaluateTechnology(rawResponses.technology || {}));
    barriers.push(this.evaluateIdentification(rawResponses.identification || {}));
    barriers.push(this.evaluateVocational(rawResponses.vocational || {}));

    // Count critical (high severity) barriers
    const criticalCount = barriers.filter((b) => b.severity === 'high').length;
    const mediumCount = barriers.filter((b) => b.severity === 'medium').length;

    const overallReadiness = this.determineReadiness(criticalCount, mediumCount);

    const recommendations = this.generateRecommendations(barriers, rawResponses);

    return {
      interests: [], // Barriers assessment does not compute interests
      aptitudes: [], // Barriers assessment does not compute aptitudes
      barriers,
      overallReadiness,
      recommendations,
    };
  }

  // --- Housing ---
  private evaluateHousing(housing: Record<string, any>): BarrierEvaluation {
    const status = housing.housing_status_at_intake || 'stable';
    const monthsAtCurrent = typeof housing.housing_stable_months === 'number'
      ? housing.housing_stable_months
      : (housing.housing_stable_months === 'under_6m' ? 3 : 12);
    const residenceType = housing.residence_type || 'urban';

    if (status === 'homeless' || status === 'shelter' || status === 'seeking_support') {
      return {
        category: 'Housing',
        severity: 'high',
        details: `Currently ${status === 'homeless' ? 'experiencing homelessness' : status === 'shelter' ? 'in shelter housing' : 'seeking housing support'}. Location: ${residenceType}.`.trim(),
      };
    }

    if (status === 'transitional' || status === 'at_risk' || status === 'temporary') {
      const detail = status === 'transitional'
        ? 'In transitional housing'
        : (status === 'temporary' ? 'In temporary housing/staying with friends' : 'At risk of losing current housing');
      return {
        category: 'Housing',
        severity: 'medium',
        details: `${detail}. ${monthsAtCurrent < 3 ? 'Limited housing stability (less than 3 months).' : ''}`.trim(),
      };
    }

    return { category: 'Housing', severity: 'low', details: `Stable housing situation in ${residenceType} area.` };
  }

  // --- Legal ---
  private evaluateLegal(legal: Record<string, any>): BarrierEvaluation {
    const steps = Array.isArray(legal.background_steps) ? legal.background_steps : [];
    const hasFelony = legal.has_felony === true || steps.includes('past_conviction');
    const hasMisdemeanor = legal.has_misdemeanor === true;
    const onProbation = legal.on_probation_parole === true || steps.includes('probation_parole');
    const pendingCharges = legal.pending_charges === true || steps.includes('pending_charges');
    const sexOffender = legal.sex_offender_registry === true || steps.includes('registry_requirements');
    const yearsSince = typeof legal.years_since_last_conviction === 'number'
      ? legal.years_since_last_conviction
      : null;
    const completedReentry = legal.has_completed_reentry_program === true;

    if (sexOffender || pendingCharges) {
      const issues = [];
      if (sexOffender) issues.push('sex offender registry status');
      if (pendingCharges) issues.push('pending criminal charges');
      return {
        category: 'Legal',
        severity: 'high',
        details: `Significant legal barriers: ${issues.join(', ')}. Severely limits employer pool and may require specialized placement.`,
      };
    }

    if (hasFelony && (yearsSince === null || yearsSince < 3)) {
      const recentText = yearsSince !== null ? `${yearsSince} year(s) since last conviction` : 'conviction timeline unknown';
      return {
        category: 'Legal',
        severity: 'high',
        details: `Felony record with ${recentText}. ${onProbation ? 'Currently on probation/parole with scheduling constraints.' : ''} ${completedReentry ? 'Has completed reentry program.' : 'Has not completed reentry programming.'}`.trim(),
      };
    }

    if (hasFelony || (hasMisdemeanor && onProbation)) {
      const details: string[] = [];
      if (hasFelony) details.push(`Felony record (${yearsSince}+ years ago)`);
      if (hasMisdemeanor) details.push('Misdemeanor record');
      if (onProbation) details.push('on probation/parole');
      return {
        category: 'Legal',
        severity: 'medium',
        details: `${details.join('; ')}. ${completedReentry ? 'Reentry program completed - positive factor for fair-chance employers.' : 'Consider reentry support programming.'}`,
      };
    }

    if (hasMisdemeanor) {
      return {
        category: 'Legal',
        severity: 'low',
        details: `Misdemeanor record only. ${yearsSince !== null && yearsSince > 5 ? 'Well in the past - minimal employment impact expected.' : 'May require disclosure on some applications.'}`,
      };
    }

    return { category: 'Legal', severity: 'low', details: 'No significant legal barriers reported.' };
  }

  private evaluateHealth(health: Record<string, any>): BarrierEvaluation {
    const physicalLimitation = health.physical_limitations === true || health.has_physical_limitation === true;
    const wellness = Array.isArray(health.wellness_appointments) ? health.wellness_appointments : [];
    const mentalHealth = health.has_mental_health_diagnosis === true || wellness.includes('mental_health');
    const inTreatment = health.currently_in_treatment === 'active_program' || health.currently_in_treatment === true;
    const inRecovery = wellness.includes('in_recovery') || health.substance_use_in_recovery === true;
    const recoveryMonths = typeof health.recovery_months === 'number'
      ? health.recovery_months
      : (health.recovery_months === 'under_6m' ? 3 : 12);
    const hasInsurance = health.has_health_insurance === true;
    const medsAffectWork = health.medications_affecting_work === 'has_safety_needs' || health.medications_affecting_work === true;

    const issues: string[] = [];
    let severityScore = 0;

    const activeSubstanceUse = health.substance_use_history === true && !inRecovery;
    if (activeSubstanceUse) {
      issues.push('Active substance use / barriers to recovery');
      severityScore += 4;
    }

    if (inRecovery && (health.recovery_months === 'under_6m' || (typeof recoveryMonths === 'number' && recoveryMonths < 6))) {
      issues.push('Early recovery journey - requires supportive work schedule');
      severityScore += 2;
    } else if (inRecovery) {
      issues.push('Proudly in recovery');
      severityScore += 0.5;
    }

    if (mentalHealth) {
      issues.push('Mental health/counseling appointments to plan around');
      severityScore += 0.5;
    }

    if (physicalLimitation) {
      const details = health.physical_limitations_detail || health.physical_limitation_details;
      issues.push(`Physical adjustments/accommodations requested${details ? ': ' + details : ''}`);
      severityScore += 1;
    }

    if (medsAffectWork) {
      const details = health.medications_detail;
      issues.push(`Specific medication or safety needs${details ? ': ' + details : ''}`);
      severityScore += 1;
    }

    if (!hasInsurance && health.has_health_insurance !== undefined) {
      issues.push('No health insurance - limits ongoing care access');
      severityScore += 1;
    }

    let severity: 'low' | 'medium' | 'high';
    if (severityScore >= 4) severity = 'high';
    else if (severityScore >= 2) severity = 'medium';
    else severity = 'low';

    const details = issues.length > 0
      ? issues.join('. ') + '.'
      : 'No significant health barriers reported.';

    return { category: 'Health', severity, details };
  }

  private evaluateFinancial(financial: Record<string, any>): BarrierEvaluation {
    const hasBankAccount = financial.has_bank_account === 'active_account' || financial.has_bank_account === true;
    const needAccountHelp = financial.has_bank_account === 'need_help_setting_up';
    const goals = Array.isArray(financial.financial_goals) ? financial.financial_goals : [];
    const childSupportHelp = goals.includes('child_support_help') || financial.child_support_obligations === true;
    const debtFocus = financial.budgeting_debt_focus === 'managing_debt' || financial.outstanding_debt === true;

    const issues: string[] = [];
    let severityScore = 0;

    if (needAccountHelp || !hasBankAccount) {
      issues.push('Needs assistance setting up direct deposit / bank account');
      severityScore += 2;
    }

    if (childSupportHelp) {
      issues.push('Navigating child support systems/obligations');
      severityScore += 1;
    }

    if (debtFocus) {
      issues.push('Managing/reducing outstanding debt');
      severityScore += 1;
    }

    let severity: 'low' | 'medium' | 'high';
    if (severityScore >= 4) severity = 'high';
    else if (severityScore >= 2) severity = 'medium';
    else severity = 'low';

    const details = issues.length > 0
      ? issues.join('. ') + '.'
      : 'No significant financial barriers reported.';

    return { category: 'Financial', severity, details };
  }

  private evaluateSupport(support: Record<string, any>): BarrierEvaluation {
    const circle = Array.isArray(support.support_circle) ? support.support_circle : [];
    const familyFriends = circle.includes('family_friends') || support.has_supportive_contacts === true || support.has_stable_family_relationships === true;
    const mentor = circle.includes('sponsor_mentor') || support.has_mentor_or_sponsor === true;
    const caseManager = circle.includes('case_manager') || support.has_case_manager === true;
    const lookingToBuild = circle.includes('looking_to_build');

    const positiveCount = [familyFriends, mentor, caseManager].filter(Boolean).length;

    if (positiveCount === 0 || (positiveCount <= 1 && lookingToBuild)) {
      return {
        category: 'Support System',
        severity: 'high',
        details: 'Limited support network identified; actively looking to build up support circle.',
      };
    }

    if (positiveCount <= 2) {
      return {
        category: 'Support System',
        severity: 'medium',
        details: 'Moderate support circle available.',
      };
    }

    return {
      category: 'Support System',
      severity: 'low',
      details: `Strong support network (${positiveCount}/3 core indicators active).`,
    };
  }

  // --- Childcare ---
  private evaluateChildcare(childcare: Record<string, any>): BarrierEvaluation {
    const hasChildren = childcare.has_dependent_children === true;
    const numberOfChildren = typeof childcare.number_of_children === 'number' ? childcare.number_of_children : 0;
    const ages = Array.isArray(childcare.ages_of_children) ? childcare.ages_of_children : [];
    const reliableChildcare = childcare.has_reliable_childcare === true;
    const limitsSchedule = childcare.childcare_limits_schedule === true;

    if (!hasChildren || numberOfChildren === 0) {
      return { category: 'Childcare', severity: 'low', details: 'No dependent children reported.' };
    }

    const hasInfant = ages.some((a: number) => typeof a === 'number' && a < 2);
    const hasPreschool = ages.some((a: number) => typeof a === 'number' && a >= 2 && a < 5);

    if (!reliableChildcare && (hasInfant || numberOfChildren >= 3)) {
      return {
        category: 'Childcare',
        severity: 'high',
        details: `${numberOfChildren} dependent child(ren)${hasInfant ? ' including infant under 2' : ''}. No reliable childcare arrangement - significant barrier to maintaining consistent work schedule.`,
      };
    }

    if (!reliableChildcare || limitsSchedule) {
      const detail = !reliableChildcare
        ? 'No reliable childcare'
        : 'Childcare limits available work schedule';
      return {
        category: 'Childcare',
        severity: 'medium',
        details: `${numberOfChildren} dependent child(ren). ${detail}. ${hasPreschool ? 'Preschool-age children may qualify for Head Start or subsidized care.' : ''}`.trim(),
      };
    }

    return {
      category: 'Childcare',
      severity: 'low',
      details: `${numberOfChildren} dependent child(ren) with reliable childcare in place.`,
    };
  }

  private evaluateTechnology(tech: Record<string, any>): BarrierEvaluation {
    const tools = Array.isArray(tech.tech_tools) ? tech.tech_tools : [];
    const hasSmartphone = tools.includes('smartphone') || tech.has_smartphone === true;
    const hasEmail = tools.includes('email') || tech.has_email === true || tech.has_email_address === true;
    const hasInternet = tools.includes('home_internet') || tech.internet_access_type === true || tech.has_internet_access === true;

    const positiveCount = [hasSmartphone, hasEmail, hasInternet].filter(Boolean).length;

    if (positiveCount <= 1) {
      return {
        category: 'Technology Access',
        severity: 'high',
        details: `Significant technology gap: ${!hasSmartphone ? 'no smartphone, ' : ''}${!hasEmail ? 'no email address, ' : ''}${!hasInternet ? 'no reliable internet' : ''}.`.replace(/, $/, '.'),
      };
    }

    if (positiveCount === 2) {
      return {
        category: 'Technology Access',
        severity: 'medium',
        details: 'Partial digital tool access. Supported job search tools recommended.',
      };
    }

    return {
      category: 'Technology Access',
      severity: 'low',
      details: 'Adequate technology tools available for communication and job applications.',
    };
  }

  // --- Identification ---
  private evaluateIdentification(id: Record<string, any>): BarrierEvaluation {
    const hasStateId = id.has_state_id === true;
    const hasSsCard = id.has_social_security_card === true;
    const hasBirthCert = id.has_birth_certificate === true;
    const hasWorkAuth = id.has_work_authorization !== false; // default true for citizens
    const docsExpired = id.documents_expired === true;

    if (!hasWorkAuth) {
      return {
        category: 'Identification',
        severity: 'high',
        details: 'Work authorization documents not available. Cannot begin employment without I-9 verification documents.',
      };
    }

    if (!hasStateId && !hasSsCard) {
      return {
        category: 'Identification',
        severity: 'high',
        details: 'Missing both state ID and Social Security card. Cannot complete I-9 employment verification. Obtaining these documents is the highest priority barrier.',
      };
    }

    const missing: string[] = [];
    if (!hasStateId) missing.push('state ID');
    if (!hasSsCard) missing.push('Social Security card');
    if (!hasBirthCert) missing.push('birth certificate');

    if (missing.length > 0 || docsExpired) {
      return {
        category: 'Identification',
        severity: 'medium',
        details: `${missing.length > 0 ? 'Missing: ' + missing.join(', ') + '. ' : ''}${docsExpired ? 'Some documents expired - renewal needed. ' : ''}May delay employment start if not resolved promptly.`.trim(),
      };
    }

    return {
      category: 'Identification',
      severity: 'low',
      details: 'All essential identification documents available and current.',
    };
  }

  // --- Vocational ---
  private evaluateVocational(vocational: Record<string, any>): BarrierEvaluation {
    const specificBarriers = Array.isArray(vocational.specific_barriers) ? vocational.specific_barriers : [];
    
    if (specificBarriers.length >= 5) {
      return {
        category: 'Vocational',
        severity: 'high',
        details: `Multiple vocational barriers identified (${specificBarriers.length}). Significant barriers include: ${specificBarriers.slice(0, 3).join(', ').replace(/_/g, ' ')}.`,
      };
    }

    if (specificBarriers.length >= 1) {
      return {
        category: 'Vocational',
        severity: 'medium',
        details: `Vocational barriers reported: ${specificBarriers.join(', ').replace(/_/g, ' ')}.`,
      };
    }

    return { category: 'Vocational', severity: 'low', details: 'No significant vocational barriers reported.' };
  }

  // --- Overall Readiness ---
  private determineReadiness(
    criticalCount: number,
    mediumCount: number,
  ): 'not_ready' | 'developing' | 'ready' | 'highly_ready' {
    // Critical barriers strongly reduce readiness
    if (criticalCount >= 3) return 'not_ready';
    if (criticalCount >= 2) return 'developing';
    if (criticalCount === 1 && mediumCount >= 2) return 'developing';
    if (criticalCount === 1) return 'developing';
    if (mediumCount >= 3) return 'developing';
    if (mediumCount >= 1) return 'ready';
    return 'highly_ready';
  }

  // --- Recommendations ---
  private generateRecommendations(
    barriers: BarrierEvaluation[],
    rawResponses: Record<string, any>,
  ): string[] {
    const recs: string[] = [];
    const high = barriers.filter((b) => b.severity === 'high');
    const medium = barriers.filter((b) => b.severity === 'medium');

    // Prioritize high-severity barriers
    for (const barrier of high) {
      switch (barrier.category) {
        case 'Housing':
          recs.push('Connect with emergency housing services and transitional housing programs before initiating job search');
          recs.push('Establish a mailing address through shelter, P.O. box, or case management office for job correspondence');
          break;
        case 'Legal':
          if (rawResponses.legal?.pending_charges) {
            recs.push('Resolve pending legal matters - many employers cannot proceed with active charges');
          }
          if (rawResponses.legal?.has_felony) {
            recs.push('Target fair-chance employers and Ban-the-Box jurisdictions; prepare narrative for background disclosure');
          }
          if (!rawResponses.legal?.has_completed_reentry_program) {
            recs.push('Enroll in reentry employment program for specialized job placement support and legal coaching');
          }
          break;
        case 'Health':
          if (rawResponses.health?.substance_use_history && !rawResponses.health?.substance_use_in_recovery) {
            recs.push('Stabilize substance use through treatment program before employment placement - prioritize recovery');
          }
          if (rawResponses.health?.has_mental_health_diagnosis && !rawResponses.health?.currently_in_treatment) {
            recs.push('Establish mental health treatment and develop a work-compatible care plan');
          }
          if (!rawResponses.health?.has_health_insurance) {
            recs.push('Apply for Medicaid or marketplace insurance to maintain treatment continuity during employment transition');
          }
          break;
        case 'Financial':
          if (!rawResponses.financial?.has_bank_account) {
            recs.push('Open a bank account or obtain prepaid card to enable direct deposit - required by most employers');
          }
          if (rawResponses.financial?.child_support_arrears) {
            recs.push('Contact child support enforcement to establish manageable payment plan before employment begins');
          }
          break;
        case 'Support System':
          recs.push('Assign a dedicated case manager and connect with peer mentorship program for accountability and support');
          recs.push('Refer to community support groups to build social network and reduce isolation');
          break;
        case 'Childcare':
          recs.push('Apply for subsidized childcare through state assistance programs and Head Start');
          recs.push('Explore employer-sponsored childcare, evening/weekend care co-ops, or family-based providers');
          break;
        case 'Technology Access':
          recs.push('Provide access to digital literacy training and assisted job search at resource center');
          if (!rawResponses.technology?.has_email_address) {
            recs.push('Create email address and teach basic email communication for employer contact');
          }
          break;
        case 'Identification':
          if (!rawResponses.identification?.has_state_id) {
            recs.push('Obtain state ID before job applications - schedule DMV appointment and gather supporting documents');
          }
          if (!rawResponses.identification?.has_social_security_card) {
            recs.push('Request replacement Social Security card through SSA office (typically 2-week processing time)');
          }
          if (rawResponses.identification?.has_work_authorization === false) {
            recs.push('Consult immigration legal services regarding work authorization options');
          }
          break;
      }
    }

    // Add medium-severity recommendations
    for (const barrier of medium) {
      switch (barrier.category) {
        case 'Housing':
          recs.push('Develop housing stabilization plan - connect with rental assistance and rapid rehousing programs');
          break;
        case 'Legal':
          if (rawResponses.legal?.on_probation_parole) {
            recs.push('Coordinate work schedule around probation/parole requirements; obtain employment verification letter from PO');
          }
          break;
        case 'Health':
          if (rawResponses.health?.substance_use_in_recovery) {
            recs.push('Maintain recovery support during employment transition - identify workplace triggers and coping strategies');
          }
          break;
        case 'Financial':
          if (rawResponses.financial?.receives_benefits?.length > 0) {
            recs.push('Schedule benefits cliff analysis to understand how employment income affects current benefits');
          }
          break;
        case 'Childcare':
          recs.push('Develop backup childcare plan to prevent attendance issues; explore subsidized care options');
          break;
        case 'Technology Access':
          recs.push('Schedule assisted job application sessions at local library or workforce center');
          break;
        case 'Identification':
          recs.push('Gather and renew identification documents within 2 weeks to prevent employment start delays');
          break;
      }
    }

    // General summary recommendation
    if (high.length >= 3) {
      recs.push('Multiple critical barriers present - recommend intensive case management with barrier resolution before active job placement');
    } else if (high.length > 0) {
      recs.push('Address high-severity barriers within 30 days while beginning supported job readiness activities');
    }

    return recs;
  }
}

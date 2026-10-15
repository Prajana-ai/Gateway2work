import { Injectable } from '@nestjs/common';
import { ScoredResult } from './scoring.service';

/**
 * TSRG Skills Assessment Scorer
 *
 * Expected raw_responses shape:
 * {
 *   technical_skills: {
 *     computer_basics: number (0-5),
 *     data_entry: number (0-5),
 *     microsoft_office: number (0-5),
 *     email_communication: number (0-5),
 *     internet_research: number (0-5),
 *     equipment_operation: number (0-5),
 *     cash_handling: number (0-5),
 *     inventory_management: number (0-5),
 *     food_safety: number (0-5),
 *     custodial_maintenance: number (0-5),
 *     warehouse_logistics: number (0-5),
 *     forklift_operation: number (0-5),
 *     vehicle_operation: number (0-5),
 *     basic_construction: number (0-5),
 *     landscaping: number (0-5),
 *   },
 *   soft_skills: {
 *     communication: number (1-5),
 *     teamwork: number (1-5),
 *     punctuality: number (1-5),
 *     problem_solving: number (1-5),
 *     customer_service: number (1-5),
 *     time_management: number (1-5),
 *     conflict_resolution: number (1-5),
 *     adaptability: number (1-5),
 *     attention_to_detail: number (1-5),
 *     work_ethic: number (1-5),
 *   },
 *   education: {
 *     highest_level: 'none' | 'some_high_school' | 'ged' | 'high_school' | 'some_college' | 'associates' | 'bachelors' | 'masters_plus',
 *     certifications: string[],
 *     currently_enrolled: boolean,
 *   },
 *   work_experience: {
 *     total_years: number,
 *     recent_gap_months: number,
 *     industries: string[],
 *     longest_tenure_months: number,
 *   },
 *   transportation: {
 *     has_drivers_license: boolean,
 *     has_reliable_vehicle: boolean,
 *     has_public_transit_access: boolean,
 *     max_commute_minutes: number,
 *   }
 * }
 */

const SKILL_CATEGORIES: Record<string, string[]> = {
  'Digital Literacy': ['computer_basics', 'data_entry', 'microsoft_office', 'email_communication', 'internet_research'],
  'Retail & Hospitality': ['cash_handling', 'customer_service', 'inventory_management', 'food_safety'],
  'Trades & Labor': ['equipment_operation', 'basic_construction', 'custodial_maintenance', 'landscaping'],
  'Warehouse & Logistics': ['warehouse_logistics', 'forklift_operation', 'vehicle_operation'],
};

const EDUCATION_SCORES: Record<string, number> = {
  none: 0,
  some_high_school: 1,
  ged: 2,
  high_school: 3,
  high_school_ged: 3,
  trade_cert: 4,
  some_college: 4,
  associates: 5,
  bachelors: 6,
  college_degree: 6,
  masters_plus: 7,
};

function scoreToLevel(score: number): string {
  if (score <= 0) return 'none';
  if (score <= 1.5) return 'basic';
  if (score <= 2.5) return 'intermediate';
  if (score <= 3.5) return 'advanced';
  return 'expert';
}

@Injectable()
export class CurrentWorkProfileScorer {
  score(rawResponses: Record<string, any>): ScoredResult {
    const employmentStatus = rawResponses.employment_status || {};
    const education = rawResponses.education || {};
    const workExperience = rawResponses.work_history || rawResponses.work_experience || {};
    const transportation = rawResponses.transportation || {};

    // --- Compute scores for each of the 4 requested categories ---
    const statusAtIntake = employmentStatus.employment_status_at_intake || 'unemployed';
    const workPictureScore = statusAtIntake === 'employed_ft' ? 5.0 : (statusAtIntake === 'employed_pt' ? 4.0 : 2.0);

    const experienceScore = this.computeExperienceScore(workExperience);
    const educationScore = this.computeEducationScore(education);
    const transportationScore = this.computeTransportationScore(transportation);

    const aptitudes: { category: string; level: string; score: number }[] = [
      {
        category: 'Current Work Picture',
        level: scoreToLevel(workPictureScore),
        score: workPictureScore,
      },
      {
        category: 'Work History',
        level: scoreToLevel(experienceScore * 5),
        score: Math.round(experienceScore * 5 * 100) / 100,
      },
      {
        category: 'Learning Foundation',
        level: scoreToLevel(educationScore * 5),
        score: Math.round(educationScore * 5 * 100) / 100,
      },
      {
        category: 'Commuting & Getting to Work',
        level: scoreToLevel(transportationScore * 5),
        score: Math.round(transportationScore * 5 * 100) / 100,
      },
    ];

    // Weighted composite: current work 25%, experience 30%, education 25%, transportation 20%
    const composite =
      (workPictureScore / 5) * 0.25 +
      experienceScore * 0.30 +
      educationScore * 0.25 +
      transportationScore * 0.20;

    const overallReadiness = this.compositeToReadiness(composite);

    // --- Generate recommendations ---
    const recommendations = this.generateRecommendations(
      aptitudes,
      education,
      workExperience,
      transportation,
      composite,
    );

    return {
      interests: [], // Skills assessment does not compute interests
      aptitudes,
      barriers: [], // Skills assessment does not compute barriers
      overallReadiness,
      recommendations,
    };
  }

  private computeExperienceScore(workExperience: Record<string, any>): number {
    const previousEmployment = workExperience.previous_employment === true;
    const totalYears = typeof workExperience.years_experience === 'number'
      ? workExperience.years_experience
      : (typeof workExperience.total_years === 'number' ? workExperience.total_years : 0);
    const resumeAvailable = workExperience.resume_available === true;
    const resumeFreshness = workExperience.resume_freshness;

    // Base score from total years: 0 = 0, 1 = 0.4, 2 = 0.6, 5+ = 1.0
    let yearsComponent = Math.min(totalYears / 5, 1.0);

    // If they have had a job in the past but totalYears is somehow 0, give a base of 0.3 for positive work history
    if (previousEmployment && yearsComponent === 0) {
      yearsComponent = 0.3;
    }

    // Bonus for having an up-to-date resume ready to share!
    let resumeBonus = 0;
    if (resumeAvailable) {
      if (resumeFreshness === 'current_ready') {
        resumeBonus = 0.2;
      } else if (resumeFreshness === 'mostly_ready_quick_review') {
        resumeBonus = 0.1;
      } else {
        resumeBonus = 0.05;
      }
    }

    return Math.max(0, Math.min(1, yearsComponent + resumeBonus));
  }

  private computeAverageSkillScore(
    aptitudes: { category: string; level: string; score: number }[],
  ): number {
    if (aptitudes.length === 0) return 0;
    const avg = aptitudes.reduce((sum, a) => sum + a.score, 0) / aptitudes.length;
    // Normalize to 0-1 (scores are 0-5)
    return Math.min(avg / 5, 1.0);
  }

  private computeEducationScore(education: Record<string, any>): number {
    const level = education.highest_degree_earned || 'none';
    const base = (EDUCATION_SCORES[level] ?? 0) / 7; // Normalize to 0-1
    let certBonus = 0;
    if (Array.isArray(education.certifications)) {
      certBonus = Math.min(education.certifications.length * 0.1, 0.3);
    } else if (typeof education.certifications === 'string' && education.certifications.trim().length > 0) {
      certBonus = 0.2;
    }
    const enrolledBonus = education.currently_enrolled ? 0.1 : 0;
    return Math.min(base + certBonus + enrolledBonus, 1.0);
  }

  private computeTransportationScore(transportation: Record<string, any>): number {
    let score = 0;

    const reliableOptions = Array.isArray(transportation.reliable_options)
      ? transportation.reliable_options
      : [];

    if (transportation.valid_drivers_license || reliableOptions.includes('valid_drivers_license')) score += 0.3;
    if (transportation.has_reliable_vehicle || transportation.has_vehicle || reliableOptions.includes('has_vehicle')) score += 0.35;
    if (transportation.has_public_transit_access || transportation.access_to_transit || reliableOptions.includes('public_transit')) score += 0.25;
    if (reliableOptions.includes('walk_bike_rideshare')) score += 0.1;

    const distance = transportation.willing_to_commute_miles;
    if (distance === '20_plus' || distance === 'remote_only' || (typeof distance === 'number' && distance >= 20)) {
      score += 0.1;
    } else if (distance === '10_to_20' || (typeof distance === 'number' && distance >= 10)) {
      score += 0.05;
    }

    return Math.min(score, 1.0);
  }

  private compositeToReadiness(
    composite: number,
  ): 'not_ready' | 'developing' | 'ready' | 'highly_ready' {
    if (composite >= 0.75) return 'highly_ready';
    if (composite >= 0.5) return 'ready';
    if (composite >= 0.25) return 'developing';
    return 'not_ready';
  }

  private generateRecommendations(
    aptitudes: { category: string; level: string; score: number }[],
    education: Record<string, any>,
    workExperience: Record<string, any>,
    transportation: Record<string, any>,
    composite: number,
  ): string[] {
    const recs: string[] = [];

    // Digital proficiency recommendations based on actual answers
    const digitalProf = education?.digital_proficiency;
    if (digitalProf === 'brush_up') {
      recs.push('Enroll in basic computer skills training to improve employability across sectors');
    }

    const englishProf = education?.english_proficiency;
    if (englishProf === 'brush_up') {
      recs.push('Participate in conversational English or workplace communication workshops');
    }

    const mathProf = education?.math_proficiency;
    if (mathProf === 'brush_up') {
      recs.push('Utilize everyday math brush-up tools to increase confidence with workplace numbers and cash handling');
    }

    // Education recommendations
    const level = education.highest_degree_earned || 'none';
    if (level === 'none' || level === 'some_high_school') {
      recs.push('Pursue GED completion to meet minimum requirements for most employment opportunities');
    }
    if ((level === 'ged' || level === 'high_school') && !education.currently_enrolled) {
      recs.push('Explore community college or vocational training programs to expand career options');
    }

    // Work experience gaps
    const recentGap = workExperience.recent_gap_months || 0;
    if (recentGap > 12) {
      recs.push('Consider transitional employment or volunteer work to rebuild work history and references');
    } else if (recentGap > 6) {
      recs.push('Address employment gap in resume through skills-based format highlighting transferable abilities');
    }

    if ((workExperience.total_years || 0) === 0) {
      recs.push('Start with entry-level or supported employment to build foundational work experience');
    }

    // Transportation barriers
    const reliableOptions = Array.isArray(transportation.reliable_options)
      ? transportation.reliable_options
      : [];
    const hasLicense = transportation.valid_drivers_license || reliableOptions.includes('valid_drivers_license');
    const hasVehicle = transportation.has_reliable_vehicle || transportation.has_vehicle || reliableOptions.includes('has_vehicle');
    const hasTransit = transportation.has_public_transit_access || transportation.access_to_transit || reliableOptions.includes('public_transit');

    if (!hasLicense && !hasTransit) {
      recs.push('Address transportation barriers before job placement - explore transit passes, rideshare programs, or license reinstatement');
    } else if (!hasVehicle && !hasTransit) {
      recs.push('Explore employer shuttle programs or carpool matching for workplaces outside transit routes');
    }

    if (hasLicense && !hasVehicle) {
      recs.push('Connect with vehicle assistance programs or employer-provided transportation options');
    }

    // Overall readiness
    if (composite < 0.25) {
      recs.push('Focus on foundational readiness: education completion, basic skills training, and barrier resolution before active job search');
    }

    return recs;
  }
}

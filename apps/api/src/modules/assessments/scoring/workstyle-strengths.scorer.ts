import { Injectable } from '@nestjs/common';
import { ScoredResult } from './scoring.service';

/**
 * TSRG Interests Assessment Scorer (Holland Code / RIASEC)
 *
 * Expected raw_responses shape:
 * {
 *   riasec: {
 *     realistic: number[],     // Array of 1-5 ratings for each question in this category
 *     investigative: number[],
 *     artistic: number[],
 *     social: number[],
 *     enterprising: number[],
 *     conventional: number[],
 *   },
 *   preferred_work_environment: 'indoor' | 'outdoor' | 'mixed',
 *   preferred_schedule: 'full_time' | 'part_time' | 'flexible',
 *   physical_preference: 'sedentary' | 'light' | 'moderate' | 'heavy',
 *   industries_of_interest: string[],
 * }
 *
 * Each RIASEC dimension has multiple items rated 1-5 (strongly dislike to strongly like).
 */

interface RiasecScores {
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
}

const RIASEC_LABELS: Record<string, string> = {
  realistic: 'Realistic (Doers)',
  investigative: 'Investigative (Thinkers)',
  artistic: 'Artistic (Creators)',
  social: 'Social (Helpers)',
  enterprising: 'Enterprising (Persuaders)',
  conventional: 'Conventional (Organizers)',
};

/**
 * Maps RIASEC codes to career sectors relevant to TSRG workforce populations.
 * Focuses on accessible career pathways.
 */
const RIASEC_CAREER_MAP: Record<string, string[]> = {
  realistic: [
    'Construction & Building Trades',
    'Warehouse & Distribution',
    'Automotive Maintenance',
    'Landscaping & Groundskeeping',
    'Manufacturing & Assembly',
    'Custodial & Facilities Maintenance',
  ],
  investigative: [
    'Information Technology Support',
    'Quality Control & Inspection',
    'Environmental Services',
    'Laboratory Technician',
    'Data Entry & Analysis',
  ],
  artistic: [
    'Graphic Design & Print Production',
    'Culinary Arts & Food Preparation',
    'Barbering & Cosmetology',
    'Photography & Media',
    'Floral Design & Event Setup',
  ],
  social: [
    'Healthcare Support (CNA, Home Health)',
    'Childcare & Early Education',
    'Community Health Worker',
    'Peer Support Specialist',
    'Customer Service & Reception',
    'Social Services Aide',
  ],
  enterprising: [
    'Retail Sales & Management',
    'Food Service Management',
    'Small Business & Entrepreneurship',
    'Real Estate Support',
    'Delivery & Route Sales',
  ],
  conventional: [
    'Administrative & Office Support',
    'Bookkeeping & Accounting Clerk',
    'Medical Records & Coding',
    'Shipping & Receiving',
    'Inventory Management',
    'Data Entry & Filing',
  ],
};

@Injectable()
export class WorkstyleStrengthsScorer {
  score(rawResponses: Record<string, any>): ScoredResult {
    const riasecRaw = rawResponses.discover_work_style || rawResponses.riasec || {};

    // Helper to evaluate score for a RIASEC dimension
    const getDimensionScore = (val: unknown): number => {
      if (!Array.isArray(val)) return 0;
      if (val.length === 0) return 0;
      // If elements are numbers (legacy/test format)
      if (typeof val[0] === 'number') {
        const nums = val.filter((v): v is number => typeof v === 'number' && v >= 1 && v <= 5);
        if (nums.length === 0) return 0;
        return nums.reduce((sum, v) => sum + v, 0) / nums.length;
      }
      // If elements are strings (active checkbox list format)
      // Since there are 5 checkboxes, each selection contributes 1.0 points to match the 1-5 scale!
      return Math.min(val.length, 5);
    };

    // --- Compute average for each RIASEC dimension ---
    const riasecScores: RiasecScores = {
      realistic: getDimensionScore(riasecRaw.realistic),
      investigative: getDimensionScore(riasecRaw.investigative),
      artistic: getDimensionScore(riasecRaw.artistic),
      social: getDimensionScore(riasecRaw.social),
      enterprising: getDimensionScore(riasecRaw.enterprising),
      conventional: getDimensionScore(riasecRaw.conventional),
    };

    // --- Rank dimensions and pick top 3 ---
    const ranked = Object.entries(riasecScores)
      .map(([key, score]) => ({ key, score, label: RIASEC_LABELS[key] }))
      .sort((a, b) => b.score - a.score);

    const top3 = ranked.slice(0, 3);
    const interests = top3.map((r) => r.label);

    // --- Build aptitudes from RIASEC scores ---
    const aptitudes = ranked.map((r) => ({
      category: r.label,
      level: this.scoreToInterestLevel(r.score),
      score: Math.round(r.score * 100) / 100,
    }));

    // --- Map top interests to career sectors ---
    const matchedSectors: string[] = [];
    for (const dim of top3) {
      const sectors = RIASEC_CAREER_MAP[dim.key] || [];
      matchedSectors.push(...sectors);
    }

    // --- Determine readiness based on interest clarity ---
    // Strong, differentiated interests indicate better career direction
    const topScore = top3[0]?.score || 0;
    const spread = topScore - (ranked[ranked.length - 1]?.score || 0);
    const overallReadiness = this.interestClarityToReadiness(topScore, spread);

    // --- Generate recommendations ---
    const recommendations = this.generateRecommendations(
      top3,
      matchedSectors,
      rawResponses,
      spread,
    );

    return {
      interests,
      aptitudes,
      barriers: [], // Interests assessment does not compute barriers
      overallReadiness,
      recommendations,
    };
  }

  private averageArray(arr: unknown): number {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    const nums = arr.filter((v): v is number => typeof v === 'number' && v >= 1 && v <= 5);
    if (nums.length === 0) return 0;
    return nums.reduce((sum, v) => sum + v, 0) / nums.length;
  }

  private scoreToInterestLevel(score: number): string {
    if (score >= 4.0) return 'strong';
    if (score >= 3.0) return 'moderate';
    if (score >= 2.0) return 'mild';
    return 'low';
  }

  private interestClarityToReadiness(
    topScore: number,
    spread: number,
  ): 'not_ready' | 'developing' | 'ready' | 'highly_ready' {
    // High top score + good differentiation = clear career direction
    if (topScore >= 3.5 && spread >= 1.5) return 'highly_ready';
    if (topScore >= 3.0 && spread >= 1.0) return 'ready';
    if (topScore >= 2.0) return 'developing';
    return 'not_ready';
  }

  private generateRecommendations(
    top3: { key: string; score: number; label: string }[],
    matchedSectors: string[],
    rawResponses: Record<string, any>,
    spread: number,
  ): string[] {
    const recs: string[] = [];

    // Primary interest area recommendation
    if (top3.length > 0 && top3[0].score >= 3.0) {
      const topKey = top3[0].key;
      const topSectors = RIASEC_CAREER_MAP[topKey] || [];
      if (topSectors.length > 0) {
        const sampleCareers = topSectors.slice(0, 3).join(', ');
        recs.push(`Primary interest aligns with ${top3[0].label} careers - explore: ${sampleCareers}`);
      }
    }

    // Holland Code combination recommendation
    if (top3.length >= 2 && top3[1].score >= 2.5) {
      const code = top3.slice(0, 3).map((t) => t.key.charAt(0).toUpperCase()).join('');
      recs.push(`Holland Code profile: ${code} - use this to filter career exploration resources and job matching`);
    }

    // Low differentiation suggests exploration needed
    if (spread < 0.8) {
      recs.push('Interest profile shows low differentiation - recommend job shadowing or informational interviews across multiple sectors to clarify preferences');
    }

    // Environment preferences
    const environment = rawResponses.preferred_work_environment;
    const schedule = rawResponses.preferred_schedule;
    const physical = rawResponses.physical_preference;

    if (environment === 'outdoor' && top3.some((t) => t.key === 'realistic')) {
      recs.push('Outdoor work preference combined with Realistic interests - strong fit for construction, landscaping, or environmental services');
    }

    if (schedule === 'part_time') {
      recs.push('Part-time preference noted - explore positions that offer flexible or part-time scheduling as a pathway to full-time employment');
    }

    if (physical === 'sedentary' || physical === 'light') {
      recs.push('Light physical preference - prioritize office, administrative, or technology-oriented career pathways');
    } else if (physical === 'heavy') {
      recs.push('Comfortable with heavy physical work - warehouse, construction, and manufacturing roles are strong candidates');
    }

    // Career exploration for undecided
    if (top3[0]?.score < 2.5) {
      recs.push('Low overall interest scores may indicate limited career awareness - recommend career exploration workshops and hands-on job sampling');
    }

    // Specific sector suggestions based on industries of interest
    const industries = rawResponses.industries_of_interest;
    if (Array.isArray(industries) && industries.length > 0) {
      const overlap = industries.filter((ind: string) =>
        matchedSectors.some((s) => s.toLowerCase().includes(ind.toLowerCase())),
      );
      if (overlap.length > 0) {
        recs.push(`Self-reported industry interests align with RIASEC profile - good career direction confidence`);
      } else {
        recs.push('Self-reported industry interests differ from RIASEC profile - discuss with workforce specialist to reconcile preferences with aptitudes');
      }
    }

    return recs;
  }
}

/**
 * Helpers for the mock-data installer (mock-data.ts).
 *
 * Kept separate so the main installer stays focused on insert orchestration.
 * No NestJS imports — runnable standalone via ts-node or compiled node.
 */

import { faker } from '@faker-js/faker';

// ---------------------------------------------------------------------------
// Mock-tenant constants
// ---------------------------------------------------------------------------

export const MOCK_TENANT = {
  name: 'TSRG Mock',
  slug: 'tsrg-mock',
  vertical: 'tsrg_workforce' as const,
};

export const MOCK_ADMIN = {
  email: 'mock-admin@tsrg.org',
  password: 'changeme123',
  firstName: 'Mock',
  lastName: 'Admin',
};

export const MOCK_STAFF_FIXTURES = [
  { firstName: 'Riley', lastName: 'Hernandez', role: 'workforce_specialist', department: 'Workforce' },
  { firstName: 'Jordan', lastName: 'Okafor', role: 'workforce_specialist', department: 'Workforce' },
  { firstName: 'Avery', lastName: 'Nguyen', role: 'provider_case_manager', department: 'Recovery' },
];

export const MOCK_EMPLOYER_FIXTURES = [
  { name: 'BlueRiver Manufacturing', industry: 'Manufacturing' },
  { name: 'Cedar Park Logistics', industry: 'Logistics' },
  { name: 'Lakeside Hospitality Group', industry: 'Hospitality' },
  { name: 'Harborlight Construction', industry: 'Construction' },
  { name: 'Northwind Healthcare Services', industry: 'Healthcare' },
];

// RFE fixtures are intentionally a superset of plain employers — they carry
// the recovery-friendly attributes the matching/IPS flows expect.
export const MOCK_RFE_FIXTURES = [
  {
    name: 'BlueRiver Manufacturing',
    sector: 'Manufacturing',
    traineeReadiness: 'yes',
    isFairChance: true,
    salaryRange: 'livable wage',
  },
  {
    name: 'Cedar Park Logistics',
    sector: 'Logistics',
    traineeReadiness: 'limited',
    isFairChance: true,
    salaryRange: 'competitive wage',
  },
  {
    name: 'Lakeside Hospitality Group',
    sector: 'Hospitality',
    traineeReadiness: 'yes',
    isFairChance: false,
    salaryRange: 'minimum wage',
  },
  {
    name: 'Harborlight Construction',
    sector: 'Construction',
    traineeReadiness: 'yes',
    isFairChance: true,
    salaryRange: 'livable wage',
  },
  {
    name: 'Northwind Healthcare Services',
    sector: 'Healthcare',
    traineeReadiness: 'limited',
    isFairChance: false,
    salaryRange: 'competitive wage',
  },
];

// ---------------------------------------------------------------------------
// Stochastic helpers
// ---------------------------------------------------------------------------

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function chance(p: number): boolean {
  return Math.random() < p;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function fidelityScore(): number {
  // IPS reviews scored 1–5; bias toward 3–4 (typical pilot scores).
  return pick([2, 3, 3, 3, 4, 4, 4, 5]);
}

// ---------------------------------------------------------------------------
// Domain field generators
// ---------------------------------------------------------------------------

export function buildDemographics() {
  const sex = pick(['female', 'male', 'non_binary']);
  return {
    first_name: faker.person.firstName(sex === 'female' ? 'female' : sex === 'male' ? 'male' : undefined),
    last_name: faker.person.lastName(),
    preferred_name: null,
    date_of_birth: faker.date.birthdate({ min: 22, max: 58, mode: 'age' }).toISOString().slice(0, 10),
    sex,
    race: pick(['white', 'black_or_african_american', 'asian', 'american_indian', 'two_or_more', 'prefer_not_to_say']),
    ethnicity: pick(['hispanic_or_latino', 'not_hispanic_or_latino', 'prefer_not_to_say']),
    phone: faker.phone.number(),
    email: faker.internet.email().toLowerCase(),
    address_line_1: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zip: faker.location.zipCode('#####'),
  };
}

export function buildLegalInfo() {
  return {
    consent_42cfr_signed: true,
    consent_signed_date: faker.date.recent({ days: 180 }).toISOString().slice(0, 10),
    has_court_involvement: chance(0.35),
    on_probation_or_parole: chance(0.25),
  };
}

export function buildSocioeconomic() {
  return {
    housing_status: pick(['stable', 'transitional', 'homeless', 'rental_at_risk']),
    has_transportation: chance(0.6),
    has_digital_access: chance(0.75),
    primary_income_source: pick(['employment', 'tanf', 'snap', 'family_support', 'none']),
  };
}

export function buildAssessmentResponses(assessmentType: string) {
  // Minimal but plausible payloads — enough that scoring stubs can run later
  // without crashing, but small enough to keep mock data lightweight.
  if (assessmentType === 'current_work_profile') {
    return {
      employment_status: pick(['unemployed', 'underemployed', 'employed_seeking_change']),
      years_of_experience: randomInt(0, 15),
      highest_education: pick(['less_than_hs', 'hs_or_ged', 'some_college', 'associates', 'bachelors']),
      has_transportation: chance(0.7),
      skills: faker.helpers.arrayElements(
        ['customer_service', 'forklift', 'food_prep', 'data_entry', 'carpentry', 'driving_cdl', 'cleaning', 'retail'],
        { min: 1, max: 4 },
      ),
    };
  }
  if (assessmentType === 'workstyle_strengths') {
    return {
      preferred_industries: faker.helpers.arrayElements(
        ['healthcare', 'construction', 'hospitality', 'manufacturing', 'logistics', 'retail'],
        { min: 1, max: 3 },
      ),
      preferred_schedule: pick(['days', 'evenings', 'overnight', 'flexible']),
      open_to_relocation: chance(0.2),
    };
  }
  // support_needs
  return {
    transportation_barrier: chance(0.4),
    childcare_barrier: chance(0.25),
    housing_barrier: chance(0.3),
    legal_barrier: chance(0.35),
    documentation_missing: chance(0.2),
  };
}

export function buildAssessmentScores(assessmentType: string) {
  if (assessmentType === 'current_work_profile') {
    return {
      overallReadiness: randomInt(40, 95),
      aptitudes: { manual: randomInt(1, 5), cognitive: randomInt(1, 5), interpersonal: randomInt(1, 5) },
      recommendations: ['Schedule resume workshop', 'Explore CDL training'],
    };
  }
  if (assessmentType === 'workstyle_strengths') {
    return {
      interests: { realistic: randomInt(1, 5), investigative: randomInt(1, 5), social: randomInt(1, 5) },
      topMatches: faker.helpers.arrayElements(['construction', 'healthcare', 'logistics'], { min: 1, max: 2 }),
    };
  }
  return {
    barrierCount: randomInt(0, 5),
    barriers: ['transportation', 'childcare'].slice(0, randomInt(0, 2)),
    overallReadiness: randomInt(30, 80),
  };
}

export function buildEncounterNotes(serviceType: string) {
  return `${faker.lorem.sentence()} (mock encounter — ${serviceType})`;
}

export function buildPlanGoals() {
  return {
    longTerm: pick([
      'Obtain stable full-time employment in healthcare support',
      'Complete CDL certification and secure local driving role',
      'Transition into a supervisor role in hospitality',
      'Earn an associate degree while working part-time',
    ]),
    shortTerm: [
      'Complete intake assessments',
      'Identify two target employers',
      'Update and submit resume',
    ],
  };
}

export function buildTrainingFixture() {
  const start = faker.date.recent({ days: 180 });
  const end = faker.date.between({ from: start, to: new Date() });
  return {
    program_name: pick(['ServSafe Food Handler', 'OSHA-10 Construction', 'CompTIA A+', 'CDL Class A Prep', 'CNA Certificate']),
    provider: pick(['Riverbend Community College', 'Local 401 Training Center', 'Workforce Learning Hub']),
    start_date: start.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
    is_completed: true,
    credential_earned: pick(['ServSafe Certificate', 'OSHA-10 Card', 'CompTIA A+ Cert', 'CDL Class A', 'CNA']),
    credential_type: 'industry_credential',
    total_hours: randomInt(30, 240),
  };
}

export function buildEmploymentOutcome(employerId: string) {
  const startDate = faker.date.recent({ days: 120 });
  const wage = Number(faker.finance.amount({ min: 15, max: 28, dec: 2 }));
  return {
    employer_id: employerId,
    job_title: pick(['CDL Driver', 'Line Cook', 'Maintenance Tech', 'Patient Care Tech', 'Forklift Operator']),
    start_date: startDate.toISOString().slice(0, 10),
    starting_wage: wage,
    employment_type: pick(['permanent', 'temporary', 'seasonal']),
    is_full_time: chance(0.7),
    work_mode: pick(['on_site', 'hybrid', 'remote']),
    employed_at_30_days: chance(0.85),
    employed_at_60_days: chance(0.75),
    employed_at_180_days: chance(0.55),
    recovery_friendly: chance(0.6),
    job_satisfaction: randomInt(2, 5),
  };
}

export function buildFollowUp() {
  return {
    due_date: faker.date.soon({ days: 90 }).toISOString().slice(0, 10),
    status: pick(['pending', 'pending', 'completed']),
    method: pick(['phone', 'in_person', 'email']),
    employment_at_follow_up: chance(0.6),
    wage_at_follow_up: Number(faker.finance.amount({ min: 0, max: 28, dec: 2 })),
    housing_status: pick(['stable', 'transitional', 'homeless']),
  };
}

export function buildDischarge() {
  const reasonFlags = {
    completed_successfully: false,
    withdrew_voluntarily: false,
    lost_contact: false,
    referred_to_another_program: false,
    incarcerated: false,
    hospitalized: false,
  };
  const reasonKey = pick(Object.keys(reasonFlags)) as keyof typeof reasonFlags;
  reasonFlags[reasonKey] = true;
  return {
    exit_date: faker.date.recent({ days: 30 }).toISOString().slice(0, 10),
    discharge_type: reasonKey === 'completed_successfully' ? 'planned' : 'unplanned',
    reason_for_exit: reasonKey,
    wage_at_exit: reasonKey === 'completed_successfully' ? Number(faker.finance.amount({ min: 15, max: 28, dec: 2 })) : null,
    reasonFlags,
  };
}

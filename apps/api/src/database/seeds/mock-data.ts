/**
 * TSRG ImpactForge Mock Data Installer
 *
 * On-demand, idempotent, additive mock data for local development.
 *
 * - Lives in its own tenant (slug "tsrg-mock"), kept isolated from "TSRG Pilot".
 * - Re-running adds another fresh batch of participants; never mutates or
 *   deletes existing rows. Tenant/admin/RFE/staff fixtures are upserted.
 * - Each participant carries the full journey: referral, enrollment,
 *   encounters, (sometimes) assessments + plan + tasks, employer match,
 *   employment outcome, training, follow-up, optional discharge.
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx ts-node src/database/seeds/mock-data.ts [--count N]
 *   or via npm: npm run db:mock -- --count 10
 *   or in the api docker container: npm run db:mock:built -- --count 10
 */

import { Pool, PoolClient } from 'pg';
import * as bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import {
  MOCK_TENANT,
  MOCK_ADMIN,
  MOCK_STAFF_FIXTURES,
  MOCK_EMPLOYER_FIXTURES,
  MOCK_RFE_FIXTURES,
  pick,
  chance,
  randomInt,
  fidelityScore,
  buildDemographics,
  buildLegalInfo,
  buildSocioeconomic,
  buildAssessmentResponses,
  buildAssessmentScores,
  buildEncounterNotes,
  buildPlanGoals,
  buildTrainingFixture,
  buildEmploymentOutcome,
  buildFollowUp,
  buildDischarge,
} from './mock-data-helpers';

// ---------------------------------------------------------------------------
// Args + config
// ---------------------------------------------------------------------------

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  process.exit(1);
}

function parseCount(argv: string[]): number {
  const idx = argv.findIndex((a) => a === '--count');
  if (idx >= 0 && argv[idx + 1]) {
    const n = parseInt(argv[idx + 1], 10);
    if (!Number.isFinite(n) || n < 1 || n > 500) {
      console.error(`ERROR: --count must be an integer between 1 and 500 (got ${argv[idx + 1]}).`);
      process.exit(1);
    }
    return n;
  }
  return 5;
}

const PARTICIPANT_COUNT = parseCount(process.argv.slice(2));
const BCRYPT_ROUNDS = 12;

// Permission set mirrors run-seeds.ts org_admin so the mock admin can use the UI.
// Kept narrow on purpose — we only need to log in and exercise screens.
const ORG_ADMIN_PERMISSIONS = [
  { resource: 'participants', action: 'create', data_zone: 'protected' },
  { resource: 'participants', action: 'read', data_zone: 'protected' },
  { resource: 'participants', action: 'update', data_zone: 'protected' },
  { resource: 'participants', action: 'delete', data_zone: 'protected' },
  { resource: 'referrals', action: 'create', data_zone: 'protected' },
  { resource: 'referrals', action: 'read', data_zone: 'protected' },
  { resource: 'referrals', action: 'update', data_zone: 'protected' },
  { resource: 'assessments', action: 'create', data_zone: 'protected' },
  { resource: 'assessments', action: 'read', data_zone: 'protected' },
  { resource: 'assessments', action: 'read', data_zone: 'application' },
  { resource: 'workforce_plans', action: 'create', data_zone: 'application' },
  { resource: 'workforce_plans', action: 'read', data_zone: 'application' },
  { resource: 'workforce_plans', action: 'update', data_zone: 'application' },
  { resource: 'plan_tasks', action: 'create', data_zone: 'application' },
  { resource: 'plan_tasks', action: 'read', data_zone: 'application' },
  { resource: 'plan_tasks', action: 'update', data_zone: 'application' },
  { resource: 'rfe', action: 'create', data_zone: 'application' },
  { resource: 'rfe', action: 'read', data_zone: 'application' },
  { resource: 'rfe', action: 'update', data_zone: 'application' },
  { resource: 'matches', action: 'create', data_zone: 'application' },
  { resource: 'matches', action: 'read', data_zone: 'application' },
  { resource: 'matches', action: 'update', data_zone: 'application' },
  { resource: 'encounters', action: 'create', data_zone: 'protected' },
  { resource: 'encounters', action: 'read', data_zone: 'protected' },
  { resource: 'reports', action: 'read', data_zone: 'application' },
  { resource: 'reports', action: 'export', data_zone: 'application' },
  { resource: 'users', action: 'read', data_zone: 'both' },
  { resource: 'forms', action: 'read', data_zone: 'application' },
  { resource: 'consent', action: 'manage', data_zone: 'protected' },
];

// ---------------------------------------------------------------------------
// Tracking counts for the final summary
// ---------------------------------------------------------------------------

interface InsertCounts {
  participants: number;
  referrals: number;
  enrollments: number;
  encounters: number;
  assessments: number;
  assessmentSummaries: number;
  plans: number;
  planTasks: number;
  matches: number;
  employmentOutcomes: number;
  trainings: number;
  followUps: number;
  discharges: number;
  ipsReviews: number;
}

function emptyCounts(): InsertCounts {
  return {
    participants: 0,
    referrals: 0,
    enrollments: 0,
    encounters: 0,
    assessments: 0,
    assessmentSummaries: 0,
    plans: 0,
    planTasks: 0,
    matches: 0,
    employmentOutcomes: 0,
    trainings: 0,
    followUps: 0,
    discharges: 0,
    ipsReviews: 0,
  };
}

// ---------------------------------------------------------------------------
// Idempotent fixture upserts
// ---------------------------------------------------------------------------

async function upsertTenant(client: PoolClient): Promise<string> {
  const r = await client.query(
    `INSERT INTO public.tenants (name, slug, vertical_template)
     VALUES ($1, $2, $3)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [MOCK_TENANT.name, MOCK_TENANT.slug, MOCK_TENANT.vertical],
  );
  return r.rows[0].id;
}

async function upsertOrgAdminRole(client: PoolClient, tenantId: string): Promise<string> {
  const r = await client.query(
    `INSERT INTO public.roles (tenant_id, name, description, is_system_role)
     VALUES ($1, 'org_admin', 'Organization administrator (mock tenant)', true)
     ON CONFLICT (tenant_id, name) DO UPDATE SET description = EXCLUDED.description
     RETURNING id`,
    [tenantId],
  );
  const roleId: string = r.rows[0].id;

  for (const perm of ORG_ADMIN_PERMISSIONS) {
    const p = await client.query(
      `SELECT id FROM public.permissions WHERE resource=$1 AND action=$2 AND data_zone=$3`,
      [perm.resource, perm.action, perm.data_zone],
    );
    if (p.rows.length === 0) continue;
    await client.query(
      `INSERT INTO public.role_permissions (role_id, permission_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [roleId, p.rows[0].id],
    );
  }
  return roleId;
}

async function upsertMockAdmin(client: PoolClient, tenantId: string, roleId: string) {
  const hash = await bcrypt.hash(MOCK_ADMIN.password, BCRYPT_ROUNDS);
  const userRes = await client.query(
    `INSERT INTO public.users
       (tenant_id, email, password_hash, role_id, first_name, last_name, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, true)
     ON CONFLICT (tenant_id, email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash, role_id = EXCLUDED.role_id
     RETURNING id`,
    [tenantId, MOCK_ADMIN.email, hash, roleId, MOCK_ADMIN.firstName, MOCK_ADMIN.lastName],
  );
  const userId = userRes.rows[0].id;

  // Also ensure the admin has a staff record so they can perform reviews/encounters
  await client.query(
    `INSERT INTO public.staff (tenant_id, user_id, first_name, last_name, role, department)
     VALUES ($1, $2, $3, $4, 'Administrator', 'Executive')
     ON CONFLICT (tenant_id, user_id) DO NOTHING`,
    [tenantId, userId, MOCK_ADMIN.firstName, MOCK_ADMIN.lastName],
  );
}

async function ensureMockStaff(client: PoolClient, tenantId: string): Promise<string[]> {
  const existing = await client.query(
    `SELECT id FROM public.staff WHERE tenant_id = $1`,
    [tenantId],
  );
  if (existing.rows.length >= MOCK_STAFF_FIXTURES.length) {
    return existing.rows.map((r) => r.id);
  }
  const ids: string[] = existing.rows.map((r) => r.id);
  for (const s of MOCK_STAFF_FIXTURES.slice(existing.rows.length)) {
    const r = await client.query(
      `INSERT INTO public.staff (tenant_id, first_name, last_name, role, department)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [tenantId, s.firstName, s.lastName, s.role, s.department],
    );
    ids.push(r.rows[0].id);
  }
  return ids;
}

async function ensureMockEmployers(client: PoolClient, tenantId: string): Promise<string[]> {
  const ids: string[] = [];
  for (const e of MOCK_EMPLOYER_FIXTURES) {
    const found = await client.query(
      `SELECT id FROM application.employers WHERE tenant_id = $1 AND name = $2 LIMIT 1`,
      [tenantId, e.name],
    );
    if (found.rows.length) {
      ids.push(found.rows[0].id);
      continue;
    }
    const r = await client.query(
      `INSERT INTO application.employers (tenant_id, name, industry) VALUES ($1, $2, $3) RETURNING id`,
      [tenantId, e.name, e.industry],
    );
    ids.push(r.rows[0].id);
  }
  return ids;
}

async function ensureMockRfes(client: PoolClient, tenantId: string): Promise<string[]> {
  const ids: string[] = [];
  for (const r of MOCK_RFE_FIXTURES) {
    const found = await client.query(
      `SELECT id FROM application.recovery_friendly_employers WHERE tenant_id = $1 AND name = $2 LIMIT 1`,
      [tenantId, r.name],
    );
    if (found.rows.length) {
      ids.push(found.rows[0].id);
      continue;
    }
    const inserted = await client.query(
      `INSERT INTO application.recovery_friendly_employers
         (tenant_id, name, sector, industry, is_rfe_certified, trainee_readiness,
          is_fair_chance, salary_range)
       VALUES ($1, $2, $3, $3, true, $4, $5, $6)
       RETURNING id`,
      [tenantId, r.name, r.sector, r.traineeReadiness, r.isFairChance, r.salaryRange],
    );
    ids.push(inserted.rows[0].id);
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Per-participant journey
// ---------------------------------------------------------------------------

async function seedParticipantJourney(
  client: PoolClient,
  tenantId: string,
  staffIds: string[],
  employerIds: string[],
  rfeIds: string[],
  counts: InsertCounts,
) {
  const demographics = buildDemographics();
  const externalEhrId = `mock-${faker.string.uuid()}`;
  const humanReadableId = `MOCK-${faker.string.alphanumeric({ length: 8, casing: 'upper' })}`;

  // 1. Participant
  const pRes = await client.query(
    `INSERT INTO protected.participants
       (tenant_id, external_ehr_id, participant_id, demographics, legal_info, socioeconomic,
        consent_42cfr, consent_expires_at, status)
     VALUES ($1, $2, $3, $4, $5, $6, true, NOW() + INTERVAL '12 months', $7)
     RETURNING id`,
    [
      tenantId,
      externalEhrId,
      humanReadableId,
      JSON.stringify(demographics),
      JSON.stringify(buildLegalInfo()),
      JSON.stringify(buildSocioeconomic()),
      pick(['active', 'active', 'active', 'pending']),
    ],
  );
  const participantId: string = pRes.rows[0].id;
  counts.participants++;

  // 2. Referral
  const refRes = await client.query(
    `INSERT INTO protected.referrals
       (tenant_id, participant_id, referral_status, provider_agency_name, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      tenantId,
      participantId,
      pick(['active', 'active', 'completed', 'pending']),
      pick(['Bridge Recovery Center', 'County Drug Court', 'Veterans Outreach', 'Self-Referral']),
      faker.lorem.sentence(),
    ],
  );
  const referralId: string = refRes.rows[0].id;
  counts.referrals++;

  // 3. Enrollment
  await client.query(
    `INSERT INTO protected.enrollments
       (tenant_id, participant_id, referral_id, referral_source, referral_date,
        program_enrolled_in, enrollment_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      tenantId,
      participantId,
      referralId,
      pick(['provider_agency', 'self_referral', 'court_referral']),
      faker.date.recent({ days: 240 }),
      pick(['IPS Supported Employment', 'TSRG Workforce', 'Recovery to Career']),
      faker.date.recent({ days: 200 }),
    ],
  );
  counts.enrollments++;

  // 4. Encounters (2-4)
  const encounterCount = randomInt(2, 4);
  for (let i = 0; i < encounterCount; i++) {
    const serviceType = pick(['case_management', 'career_coaching', 'job_search_assistance', 'peer_support']);
    await client.query(
      `INSERT INTO protected.encounters
         (tenant_id, participant_id, staff_id, encounter_date, duration_minutes,
          notes, billable, service_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        tenantId,
        participantId,
        pick(staffIds),
        faker.date.recent({ days: 180 }),
        pick([30, 45, 60, 90]),
        buildEncounterNotes(serviceType),
        chance(0.6),
        serviceType,
      ],
    );
    counts.encounters++;
  }

  // 5. Assessments + summaries (~60%)
  if (chance(0.6)) {
    for (const type of ['current_work_profile', 'workstyle_strengths', 'support_needs']) {
      const aRes = await client.query(
        `INSERT INTO protected.assessments
           (tenant_id, participant_id, assessment_type, raw_responses, completed_at)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          tenantId,
          participantId,
          type,
          JSON.stringify(buildAssessmentResponses(type)),
          faker.date.recent({ days: 150 }),
        ],
      );
      counts.assessments++;
      await client.query(
        `INSERT INTO application.assessment_summaries
           (tenant_id, participant_id, assessment_id, assessment_type, scores)
         VALUES ($1, $2, $3, $4, $5)`,
        [tenantId, participantId, aRes.rows[0].id, type, JSON.stringify(buildAssessmentScores(type))],
      );
      counts.assessmentSummaries++;
    }

    // 6. Workforce plan + tasks
    const goals = buildPlanGoals();
    const planRes = await client.query(
      `INSERT INTO application.workforce_plans
         (tenant_id, participant_id, long_term_goal, short_term_goals, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [tenantId, participantId, goals.longTerm, JSON.stringify(goals.shortTerm), pick(['active', 'active', 'draft'])],
    );
    const planId: string = planRes.rows[0].id;
    counts.plans++;
    const taskDescriptions = [
      'Complete intake assessments',
      'Update resume with current skills',
      'Apply to two target employers this week',
      'Attend mock interview session',
    ];
    for (const desc of taskDescriptions) {
      await client.query(
        `INSERT INTO application.plan_tasks
           (tenant_id, plan_id, description, owner_type, assigned_to, due_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          tenantId,
          planId,
          desc,
          pick(['staff', 'participant']),
          pick(staffIds),
          faker.date.soon({ days: 30 }),
          pick(['todo', 'in_progress', 'completed']),
        ],
      );
      counts.planTasks++;
    }
  }

  // 7. Employer match (~50%)
  if (chance(0.5)) {
    await client.query(
      `INSERT INTO application.participant_employer_matches
         (tenant_id, participant_id, rfe_id, application_status, outcome, applied_date)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        tenantId,
        participantId,
        pick(rfeIds),
        pick(['interested', 'applied', 'interviewing', 'offered']),
        chance(0.4) ? pick(['hired', 'in_training', 'not_hired']) : null,
        faker.date.recent({ days: 90 }),
      ],
    );
    counts.matches++;
  }

  // 8. Employment outcome (~40%)
  if (chance(0.4)) {
    const eo = buildEmploymentOutcome(pick(employerIds));
    await client.query(
      `INSERT INTO application.employment_outcomes
         (tenant_id, participant_id, employer_id, job_title, start_date, starting_wage,
          employment_type, is_full_time, work_mode, employed_at_30_days, employed_at_60_days,
          employed_at_180_days, recovery_friendly, job_satisfaction)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        tenantId,
        participantId,
        eo.employer_id,
        eo.job_title,
        eo.start_date,
        eo.starting_wage,
        eo.employment_type,
        eo.is_full_time,
        eo.work_mode,
        eo.employed_at_30_days,
        eo.employed_at_60_days,
        eo.employed_at_180_days,
        eo.recovery_friendly,
        eo.job_satisfaction,
      ],
    );
    counts.employmentOutcomes++;
  }

  // 9. Training (~40%)
  if (chance(0.4)) {
    const t = buildTrainingFixture();
    await client.query(
      `INSERT INTO protected.trainings
         (tenant_id, participant_id, program_name, provider, start_date, end_date,
          is_completed, credential_earned, credential_type, total_hours)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        tenantId,
        participantId,
        t.program_name,
        t.provider,
        t.start_date,
        t.end_date,
        t.is_completed,
        t.credential_earned,
        t.credential_type,
        t.total_hours,
      ],
    );
    counts.trainings++;
  }

  // 10. Follow-up (~50%)
  if (chance(0.5)) {
    const f = buildFollowUp();
    await client.query(
      `INSERT INTO protected.follow_ups
         (tenant_id, participant_id, due_date, status, method,
          employment_at_follow_up, wage_at_follow_up, housing_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        tenantId,
        participantId,
        f.due_date,
        f.status,
        f.method,
        f.employment_at_follow_up,
        f.wage_at_follow_up,
        f.housing_status,
      ],
    );
    counts.followUps++;
  }

  // 11. Discharge (~20% — completed journeys)
  if (chance(0.2)) {
    const d = buildDischarge();
    await client.query(
      `INSERT INTO protected.discharges
         (tenant_id, participant_id, exit_date, discharge_type, reason_for_exit,
          wage_at_exit, completed_successfully, withdrew_voluntarily, lost_contact,
          referred_to_another_program, incarcerated, hospitalized)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        tenantId,
        participantId,
        d.exit_date,
        d.discharge_type,
        d.reason_for_exit,
        d.wage_at_exit,
        d.reasonFlags.completed_successfully,
        d.reasonFlags.withdrew_voluntarily,
        d.reasonFlags.lost_contact,
        d.reasonFlags.referred_to_another_program,
        d.reasonFlags.incarcerated,
        d.reasonFlags.hospitalized,
      ],
    );
    counts.discharges++;
  }
}

async function insertIpsReview(client: PoolClient, tenantId: string, reviewerId: string, counts: InsertCounts) {
  // 26 fidelity scores in a single insert. Each score is independent — readable
  // long form rather than dynamically built so the columns are searchable.
  await client.query(
    `INSERT INTO application.ips_fidelity_reviews (
       tenant_id, reviewer_id, status,
       score_312_competitive_work, score_313_caseload_size, score_314_employment_staff, score_315_vocational_generalists,
       score_316_mh_integration, score_317_mh_contact, score_318_vr_collaboration, score_319_vocational_unit,
       score_320_ips_supervisor, score_321_zero_exclusion, score_322_agency_promotion, score_323_exec_support,
       score_324_work_incentive_planning, score_325_disclosure, score_326_vocational_assessment, score_327_rapid_job_search,
       score_328_individualized_job_search, score_329_employer_contact, score_330_employer_contact_quality, score_331_job_diversity,
       score_332_employer_diversity, score_333_competitive_jobs, score_334_individualized_follow_along, score_335_time_unlimited_follow_along,
       score_336_community_services, score_337_assertive_engagement, notes
     ) VALUES ($1, $2, 'draft',
       $3, $4, $5, $6,
       $7, $8, $9, $10,
       $11, $12, $13, $14,
       $15, $16, $17, $18,
       $19, $20, $21, $22,
       $23, $24, $25, $26,
       $27, $28, $29
     )`,
    [
      tenantId, reviewerId,
      fidelityScore(), fidelityScore(), fidelityScore(), fidelityScore(),
      fidelityScore(), fidelityScore(), fidelityScore(), fidelityScore(),
      fidelityScore(), fidelityScore(), fidelityScore(), fidelityScore(),
      fidelityScore(), fidelityScore(), fidelityScore(), fidelityScore(),
      fidelityScore(), fidelityScore(), fidelityScore(), fidelityScore(),
      fidelityScore(), fidelityScore(), fidelityScore(), fidelityScore(),
      fidelityScore(), fidelityScore(), 'Mock IPS fidelity review',
    ],
  );
  counts.ipsReviews++;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  const requireSsl = process.env.DATABASE_SSL !== 'false' && process.env.NODE_ENV !== 'development';
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ...(requireSsl ? { ssl: { rejectUnauthorized: process.env.NODE_ENV === 'production' } } : {}),
  });

  const counts = emptyCounts();

  try {
    console.log(`Connecting to database... (will insert ${PARTICIPANT_COUNT} mock participants)`);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      console.log('[1/5] Upserting mock tenant + admin user...');
      const tenantId = await upsertTenant(client);
      const roleId = await upsertOrgAdminRole(client, tenantId);
      await upsertMockAdmin(client, tenantId, roleId);
      console.log(`  -> Tenant: ${tenantId} (${MOCK_TENANT.slug})`);

      console.log('[2/5] Ensuring mock staff, employers, RFEs...');
      const staffIds = await ensureMockStaff(client, tenantId);
      const employerIds = await ensureMockEmployers(client, tenantId);
      const rfeIds = await ensureMockRfes(client, tenantId);
      console.log(`  -> staff=${staffIds.length} employers=${employerIds.length} rfes=${rfeIds.length}`);

      console.log(`[3/5] Generating ${PARTICIPANT_COUNT} participant journeys...`);
      for (let i = 0; i < PARTICIPANT_COUNT; i++) {
        await seedParticipantJourney(client, tenantId, staffIds, employerIds, rfeIds, counts);
      }

      console.log('[4/5] Adding 1 IPS fidelity review...');
      await insertIpsReview(client, tenantId, pick(staffIds), counts);

      await client.query('COMMIT');

      console.log('[5/5] Summary:');
      console.log(`  participants:         ${counts.participants}`);
      console.log(`  referrals:            ${counts.referrals}`);
      console.log(`  enrollments:          ${counts.enrollments}`);
      console.log(`  encounters:           ${counts.encounters}`);
      console.log(`  assessments:          ${counts.assessments}`);
      console.log(`  assessment_summaries: ${counts.assessmentSummaries}`);
      console.log(`  workforce_plans:      ${counts.plans}`);
      console.log(`  plan_tasks:           ${counts.planTasks}`);
      console.log(`  matches:              ${counts.matches}`);
      console.log(`  employment_outcomes:  ${counts.employmentOutcomes}`);
      console.log(`  trainings:            ${counts.trainings}`);
      console.log(`  follow_ups:           ${counts.followUps}`);
      console.log(`  discharges:           ${counts.discharges}`);
      console.log(`  ips_fidelity_reviews: ${counts.ipsReviews}`);

      const totalSatellites =
        counts.referrals + counts.enrollments + counts.encounters + counts.assessments +
        counts.assessmentSummaries + counts.plans + counts.planTasks + counts.matches +
        counts.employmentOutcomes + counts.trainings + counts.followUps + counts.discharges +
        counts.ipsReviews;
      console.log(
        `\nInserted ${counts.participants} participants and ${totalSatellites} related records into tenant ${MOCK_TENANT.slug}.`,
      );
      console.log(`Login: ${MOCK_ADMIN.email} / ${MOCK_ADMIN.password}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('\nMock data installer failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

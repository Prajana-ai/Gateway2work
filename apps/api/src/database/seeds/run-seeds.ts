/**
 * TSRG ImpactForge Seed Runner
 *
 * Seeds the database with:
 *   1. A default TSRG Pilot tenant
 *   2. System roles (org_admin, compliance_admin, workforce_specialist,
 *      provider_case_manager, participant)
 *   3. Role-permission assignments
 *   4. Three TSRG assessment form templates
 *   5. A default admin user (admin@tsrg.org)
 *
 * Usage:
 *   DATABASE_URL=postgres://... npx ts-node src/database/seeds/run-seeds.ts
 *   (or via the package script: npm run db:seed)
 */

import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';
import {
  tsrgAssessmentTemplates,
  AssessmentTemplate,
} from './tsrg-assessment-templates';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required.');
  process.exit(1);
}

const DEFAULT_ADMIN_EMAIL = 'admin@tsrg.org';
const DEFAULT_ADMIN_PASSWORD = 'changeme123';
const DEFAULT_PARTICIPANT_EMAIL = 'participant@tsrg.org';
const DEFAULT_PARTICIPANT_PASSWORD = 'changeme123';
const BCRYPT_ROUNDS = 12;

// ---------------------------------------------------------------------------
// Role -> permission mapping
// ---------------------------------------------------------------------------

interface PermissionRef {
  resource: string;
  action: string;
  data_zone: string;
}

const rolePermissions: Record<string, PermissionRef[]> = {
  org_admin: [
    // Full access to everything
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
    { resource: 'users', action: 'create', data_zone: 'both' },
    { resource: 'users', action: 'read', data_zone: 'both' },
    { resource: 'users', action: 'update', data_zone: 'both' },
    { resource: 'roles', action: 'manage', data_zone: 'both' },
    { resource: 'audit_logs', action: 'read', data_zone: 'protected' },
    { resource: 'forms', action: 'create', data_zone: 'application' },
    { resource: 'forms', action: 'read', data_zone: 'application' },
    { resource: 'consent', action: 'manage', data_zone: 'protected' },
  ],

  compliance_admin: [
    { resource: 'participants', action: 'read', data_zone: 'protected' },
    { resource: 'referrals', action: 'read', data_zone: 'protected' },
    { resource: 'assessments', action: 'read', data_zone: 'protected' },
    { resource: 'assessments', action: 'read', data_zone: 'application' },
    { resource: 'encounters', action: 'read', data_zone: 'protected' },
    { resource: 'reports', action: 'read', data_zone: 'application' },
    { resource: 'reports', action: 'export', data_zone: 'application' },
    { resource: 'users', action: 'read', data_zone: 'both' },
    { resource: 'audit_logs', action: 'read', data_zone: 'protected' },
    { resource: 'forms', action: 'read', data_zone: 'application' },
    { resource: 'consent', action: 'manage', data_zone: 'protected' },
  ],

  workforce_specialist: [
    { resource: 'participants', action: 'create', data_zone: 'protected' },
    { resource: 'participants', action: 'read', data_zone: 'protected' },
    { resource: 'participants', action: 'update', data_zone: 'protected' },
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
    { resource: 'rfe', action: 'read', data_zone: 'application' },
    { resource: 'matches', action: 'create', data_zone: 'application' },
    { resource: 'matches', action: 'read', data_zone: 'application' },
    { resource: 'matches', action: 'update', data_zone: 'application' },
    { resource: 'encounters', action: 'create', data_zone: 'protected' },
    { resource: 'encounters', action: 'read', data_zone: 'protected' },
    { resource: 'reports', action: 'read', data_zone: 'application' },
    { resource: 'forms', action: 'read', data_zone: 'application' },
    { resource: 'consent', action: 'manage', data_zone: 'protected' },
  ],

  provider_case_manager: [
    { resource: 'participants', action: 'read', data_zone: 'protected' },
    { resource: 'referrals', action: 'create', data_zone: 'protected' },
    { resource: 'referrals', action: 'read', data_zone: 'protected' },
    { resource: 'assessments', action: 'read', data_zone: 'application' },
    { resource: 'workforce_plans', action: 'read', data_zone: 'application' },
    { resource: 'plan_tasks', action: 'read', data_zone: 'application' },
    { resource: 'rfe', action: 'read', data_zone: 'application' },
    { resource: 'matches', action: 'read', data_zone: 'application' },
    { resource: 'encounters', action: 'create', data_zone: 'protected' },
    { resource: 'encounters', action: 'read', data_zone: 'protected' },
    { resource: 'forms', action: 'read', data_zone: 'application' },
  ],

  participant: [
    { resource: 'assessments', action: 'create', data_zone: 'protected' },
    { resource: 'assessments', action: 'read', data_zone: 'protected' },
    { resource: 'assessments', action: 'read', data_zone: 'application' },
    { resource: 'workforce_plans', action: 'read', data_zone: 'application' },
    { resource: 'plan_tasks', action: 'read', data_zone: 'application' },
    { resource: 'plan_tasks', action: 'update', data_zone: 'application' },
    { resource: 'matches', action: 'read', data_zone: 'application' },
    { resource: 'forms', action: 'read', data_zone: 'application' },
  ],
};

// ---------------------------------------------------------------------------
// Seed functions
// ---------------------------------------------------------------------------

async function seed() {
  const requireSsl = process.env.DATABASE_SSL !== 'false' && process.env.NODE_ENV !== 'development';
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ...(requireSsl
      ? { ssl: { rejectUnauthorized: process.env.NODE_ENV === 'production' } }
      : {}),
  });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Create default tenant
      console.log('[1/5] Creating TSRG Pilot tenant...');
      const tenantResult = await client.query(
        `INSERT INTO public.tenants (name, slug, vertical_template)
         VALUES ($1, $2, $3)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        ['TSRG Pilot', 'tsrg-pilot', 'tsrg_workforce'],
      );
      const tenantId: string = tenantResult.rows[0].id;
      console.log(`  -> Tenant ID: ${tenantId}`);

      // 2. Create roles
      console.log('[2/5] Creating default roles...');
      const roleNames = [
        'org_admin',
        'compliance_admin',
        'workforce_specialist',
        'provider_case_manager',
        'participant',
      ];
      const roleDescriptions: Record<string, string> = {
        org_admin: 'Organization administrator with full system access',
        compliance_admin:
          'Compliance and audit administrator with read access and consent management',
        workforce_specialist:
          'Workforce development specialist managing participants, assessments, and plans',
        provider_case_manager:
          'Treatment provider case manager with referral and encounter access',
        participant: 'Participant self-service role with limited read access',
      };

      const roleIdMap: Record<string, string> = {};
      for (const roleName of roleNames) {
        const roleResult = await client.query(
          `INSERT INTO public.roles (tenant_id, name, description, is_system_role)
           VALUES ($1, $2, $3, true)
           ON CONFLICT (tenant_id, name) DO UPDATE SET description = EXCLUDED.description
           RETURNING id`,
          [tenantId, roleName, roleDescriptions[roleName]],
        );
        roleIdMap[roleName] = roleResult.rows[0].id;
        console.log(`  -> Role "${roleName}": ${roleIdMap[roleName]}`);
      }

      // 3. Assign permissions to roles
      console.log('[3/5] Assigning permissions to roles...');
      let assignmentCount = 0;
      for (const [roleName, permissions] of Object.entries(rolePermissions)) {
        const roleId = roleIdMap[roleName];
        for (const perm of permissions) {
          const permResult = await client.query(
            `SELECT id FROM public.permissions
             WHERE resource = $1 AND action = $2 AND data_zone = $3`,
            [perm.resource, perm.action, perm.data_zone],
          );
          if (permResult.rows.length === 0) {
            console.warn(
              `  [WARN] Permission not found: ${perm.resource}.${perm.action} (${perm.data_zone}) - skipping`,
            );
            continue;
          }
          const permId = permResult.rows[0].id;
          await client.query(
            `INSERT INTO public.role_permissions (role_id, permission_id)
             VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [roleId, permId],
          );
          assignmentCount++;
        }
      }
      console.log(`  -> ${assignmentCount} role-permission assignments created`);

      // 4. Insert assessment form templates
      console.log('[4/5] Inserting TSRG assessment form templates...');
      await client.query(`DELETE FROM application.form_templates WHERE tenant_id = $1`, [tenantId]);
      for (const template of tsrgAssessmentTemplates) {
        await client.query(
          `INSERT INTO application.form_templates
             (tenant_id, name, vertical, assessment_type, json_schema, ui_schema, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, true)
           ON CONFLICT DO NOTHING`,
          [
            tenantId,
            template.name,
            template.vertical,
            template.assessment_type,
            JSON.stringify(template.json_schema),
            JSON.stringify(template.ui_schema),
          ],
        );
        console.log(`  -> "${template.name}" (${template.assessment_type})`);
      }

      // 5. Create default admin user
      console.log('[5/5] Creating default admin user...');
      const passwordHash = await bcrypt.hash(
        DEFAULT_ADMIN_PASSWORD,
        BCRYPT_ROUNDS,
      );
      const adminRoleId = roleIdMap['org_admin'];
      const userResult = await client.query(
        `INSERT INTO public.users
           (tenant_id, email, password_hash, role_id, first_name, last_name, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (tenant_id, email) DO UPDATE
           SET password_hash = EXCLUDED.password_hash,
               role_id = EXCLUDED.role_id
         RETURNING id`,
        [
          tenantId,
          DEFAULT_ADMIN_EMAIL,
          passwordHash,
          adminRoleId,
          'TSRG',
          'Admin',
        ],
      );
      console.log(`  -> Admin user ID: ${userResult.rows[0].id}`);
      console.log(
        `  -> Email: ${DEFAULT_ADMIN_EMAIL} / Password: ${DEFAULT_ADMIN_PASSWORD}`,
      );
      
      // 6. Create default participant user
      console.log('[6/6] Creating default participant user...');
      const participantPasswordHash = await bcrypt.hash(
        DEFAULT_PARTICIPANT_PASSWORD,
        BCRYPT_ROUNDS,
      );
      
      const participantRoleId = roleIdMap['participant'];
      
      // Check if participant user already exists
      const existingUserResult = await client.query(
        `SELECT id FROM public.users WHERE tenant_id = $1 AND email = $2`,
        [tenantId, DEFAULT_PARTICIPANT_EMAIL]
      );
      
      let participantId: string;
      const demographicsData = {
        first_name: 'Test',
        last_name: 'Participant',
        email: DEFAULT_PARTICIPANT_EMAIL,
        date_of_birth: '1990-01-01',
        address: '123 Main St',
        phone: '555-0101',
        ssn_last4: '0000'
      };

      if (existingUserResult.rows.length > 0) {
        participantId = existingUserResult.rows[0].id;
        // Update both participant profile and user details to ensure they are correct
        await client.query(
          `UPDATE protected.participants
           SET demographics = $2, status = $3, consent_42cfr = $4, consent_expires_at = $5, updated_by = $6, updated_at = NOW()
           WHERE id = $1`,
          [
            participantId,
            JSON.stringify(demographicsData),
            'active',
            true,
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            userResult.rows[0].id,
          ]
        );
        
        await client.query(
          `UPDATE public.users
           SET password_hash = $2, role_id = $3, first_name = $4, last_name = $5, is_active = true
           WHERE id = $1`,
          [
            participantId,
            participantPasswordHash,
            participantRoleId,
            'Test',
            'Participant'
          ]
        );
      } else {
        // Create new participant record and user account with same ID
        const participantRecordResult = await client.query(
          `INSERT INTO protected.participants 
             (tenant_id, participant_id, demographics, status, consent_42cfr, consent_expires_at, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
           RETURNING id`,
          [
            tenantId,
            'P-1001',
            JSON.stringify(demographicsData),
            'active',
            true,
            new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            userResult.rows[0].id, // created by admin
          ]
        );
        
        participantId = participantRecordResult.rows[0].id;
        
        await client.query(
          `INSERT INTO public.users
             (id, tenant_id, email, password_hash, role_id, first_name, last_name, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
          [
            participantId,
            tenantId,
            DEFAULT_PARTICIPANT_EMAIL,
            participantPasswordHash,
            participantRoleId,
            'Test',
            'Participant'
          ]
        );
      }
      
      console.log(`  -> Participant user ID: ${participantId}`);
      console.log(
        `  -> Email: ${DEFAULT_PARTICIPANT_EMAIL} / Password: ${DEFAULT_PARTICIPANT_PASSWORD}`,
      );

      // Seed a sample workforce plan for the test participant (idempotent)
      const existingPlan = await client.query(
        `SELECT id FROM application.workforce_plans WHERE participant_id = $1 LIMIT 1`,
        [participantId],
      );

      if (existingPlan.rows.length === 0) {
        const planResult = await client.query(
          `INSERT INTO application.workforce_plans
             (tenant_id, participant_id, long_term_goal, short_term_goals, status, created_by, updated_by)
           VALUES ($1, $2, $3, $4, 'active', $5, $5)
           RETURNING id`,
          [
            tenantId,
            participantId,
            'Obtain stable full-time employment in the healthcare or logistics sector within 12 months',
            JSON.stringify([
              'Complete GED or high school equivalency by Q2',
              'Attend 3 job-readiness workshops',
              'Obtain CDL Class B license',
            ]),
            userResult.rows[0].id,
          ],
        );

        const planId = planResult.rows[0].id;

        // Add sample tasks
        await client.query(
          `INSERT INTO application.plan_tasks
             (plan_id, tenant_id, description, owner_type, due_date, status)
           VALUES
             ($1, $2, 'Register for GED prep class at community college', 'participant', NOW() + INTERVAL '14 days', 'todo'),
             ($1, $2, 'Attend first job-readiness workshop', 'participant', NOW() + INTERVAL '7 days', 'todo'),
             ($1, $2, 'Submit résumé to 3 employers', 'participant', NOW() + INTERVAL '21 days', 'todo'),
             ($1, $2, 'Schedule CDL physical exam', 'staff', NOW() + INTERVAL '30 days', 'todo'),
             ($1, $2, 'Complete intake paperwork', 'participant', NOW() - INTERVAL '7 days', 'completed')`,
          [planId, tenantId],
        );

        console.log(`  -> Sample workforce plan seeded (ID: ${planId})`);
      } else {
        console.log('  -> Workforce plan already exists, skipping.');
      }

      await client.query('COMMIT');
      console.log('\nSeed completed successfully.');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('\nSeed failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

seed();

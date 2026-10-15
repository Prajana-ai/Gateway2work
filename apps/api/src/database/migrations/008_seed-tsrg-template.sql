-- Migration 008: Seed TSRG vertical template data
-- Default permissions, system roles template, and TSRG assessment form templates

-- ============================================================
-- Permissions (global, not tenant-specific)
-- ============================================================

INSERT INTO public.permissions (resource, action, data_zone, description) VALUES
  -- Participant management
  ('participants', 'create', 'protected', 'Create new participants'),
  ('participants', 'read', 'protected', 'View participant details including PHI'),
  ('participants', 'update', 'protected', 'Update participant records'),
  ('participants', 'delete', 'protected', 'Deactivate participants'),
  -- Referrals
  ('referrals', 'create', 'protected', 'Create referrals'),
  ('referrals', 'read', 'protected', 'View referrals'),
  ('referrals', 'update', 'protected', 'Update referral status'),
  -- Assessments
  ('assessments', 'create', 'protected', 'Submit assessments'),
  ('assessments', 'read', 'protected', 'View assessment responses'),
  ('assessments', 'read', 'application', 'View assessment summaries'),
  -- Workforce Plans
  ('workforce_plans', 'create', 'application', 'Create workforce plans'),
  ('workforce_plans', 'read', 'application', 'View workforce plans'),
  ('workforce_plans', 'update', 'application', 'Update workforce plans'),
  -- Plan Tasks
  ('plan_tasks', 'create', 'application', 'Create plan tasks'),
  ('plan_tasks', 'read', 'application', 'View plan tasks'),
  ('plan_tasks', 'update', 'application', 'Update/complete tasks'),
  -- RFE
  ('rfe', 'create', 'application', 'Add/import employers'),
  ('rfe', 'read', 'application', 'View employer directory'),
  ('rfe', 'update', 'application', 'Update employer records'),
  -- Matches
  ('matches', 'create', 'application', 'Create participant-employer matches'),
  ('matches', 'read', 'application', 'View matches'),
  ('matches', 'update', 'application', 'Update match outcomes'),
  -- Encounters
  ('encounters', 'create', 'protected', 'Log encounters'),
  ('encounters', 'read', 'protected', 'View encounters'),
  -- Reports
  ('reports', 'read', 'application', 'View reports and exports'),
  ('reports', 'export', 'application', 'Export data'),
  -- Admin
  ('users', 'create', 'both', 'Create users'),
  ('users', 'read', 'both', 'View users'),
  ('users', 'update', 'both', 'Update users'),
  ('roles', 'manage', 'both', 'Manage roles and permissions'),
  ('audit_logs', 'read', 'protected', 'View audit logs'),
  ('forms', 'create', 'application', 'Create form templates'),
  ('forms', 'read', 'application', 'View form templates'),
  ('consent', 'manage', 'protected', 'Manage participant consent records');

-- ============================================================
-- TSRG Assessment Form Templates (stored as JSONB)
-- These are global templates; copied into tenant on onboarding
-- ============================================================

-- Note: These will be inserted per-tenant during onboarding via the seed script.
-- The JSON schemas below define the structure for the 3 TSRG assessment tools.

-- Placeholder: actual form schemas are loaded via the seed script (seed-tsrg-assessments.ts)
-- because they're complex JSONB and easier to manage in TypeScript.

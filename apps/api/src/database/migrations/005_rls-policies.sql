-- Migration 005: Row-Level Security policies for tenant isolation + consent

-- ============================================================
-- Enable RLS on ALL tables
-- ============================================================

-- Public schema
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_field_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Protected schema
ALTER TABLE protected.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE protected.participants FORCE ROW LEVEL SECURITY;
ALTER TABLE protected.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE protected.referrals FORCE ROW LEVEL SECURITY;
ALTER TABLE protected.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE protected.assessments FORCE ROW LEVEL SECURITY;
ALTER TABLE protected.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE protected.encounters FORCE ROW LEVEL SECURITY;
ALTER TABLE protected.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE protected.audit_logs FORCE ROW LEVEL SECURITY;

-- Application schema
ALTER TABLE application.workforce_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.workforce_plans FORCE ROW LEVEL SECURITY;
ALTER TABLE application.plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.plan_tasks FORCE ROW LEVEL SECURITY;
ALTER TABLE application.recovery_friendly_employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.recovery_friendly_employers FORCE ROW LEVEL SECURITY;
ALTER TABLE application.participant_employer_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.participant_employer_matches FORCE ROW LEVEL SECURITY;
ALTER TABLE application.form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.form_templates FORCE ROW LEVEL SECURITY;
ALTER TABLE application.assessment_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.assessment_summaries FORCE ROW LEVEL SECURITY;

-- ============================================================
-- Tenant isolation policies (applied to every table with tenant_id)
-- Pattern: current_setting('app.current_tenant') must match tenant_id
-- ============================================================

-- Public schema policies
CREATE POLICY tenant_isolation ON public.users
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation ON public.roles
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation ON public.role_field_permissions
  FOR ALL USING (
    role_id IN (SELECT id FROM public.roles WHERE tenant_id = current_setting('app.current_tenant')::UUID)
  );

CREATE POLICY user_own_tokens ON public.refresh_tokens
  FOR ALL USING (
    user_id IN (SELECT id FROM public.users WHERE tenant_id = current_setting('app.current_tenant')::UUID)
  );

-- Protected schema policies
CREATE POLICY tenant_isolation ON protected.participants
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation ON protected.referrals
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation ON protected.assessments
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation ON protected.encounters
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation ON protected.audit_logs
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

-- Application schema policies
CREATE POLICY tenant_isolation ON application.workforce_plans
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation ON application.plan_tasks
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation ON application.recovery_friendly_employers
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation ON application.participant_employer_matches
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation ON application.form_templates
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation ON application.assessment_summaries
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

-- ============================================================
-- 42 CFR Part 2 consent policies (protected schema only)
-- These layer ON TOP of tenant isolation
-- ============================================================

CREATE POLICY consent_42cfr_gate ON protected.participants
  FOR SELECT USING (
    consent_42cfr = true AND consent_expires_at > NOW()
    OR current_setting('app.current_role', true) = 'compliance_admin'
    OR current_setting('app.consent_management_mode', true) = 'true'
  );

CREATE POLICY consent_42cfr_assessments ON protected.assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM protected.participants c
      WHERE c.id = participant_id
        AND c.consent_42cfr = true
        AND c.consent_expires_at > NOW()
    )
    OR current_setting('app.current_role', true) = 'compliance_admin'
  );

CREATE POLICY consent_42cfr_encounters ON protected.encounters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM protected.participants c
      WHERE c.id = participant_id
        AND c.consent_42cfr = true
        AND c.consent_expires_at > NOW()
    )
    OR current_setting('app.current_role', true) = 'compliance_admin'
  );

-- ============================================================
-- Audit log protection: append-only
-- ============================================================

CREATE POLICY audit_no_update ON protected.audit_logs
  FOR UPDATE USING (false);

CREATE POLICY audit_no_delete ON protected.audit_logs
  FOR DELETE USING (false);

-- ============================================================
-- Grant permissions to application role (if it exists)
-- On Azure PG Flexible Server the admin user has full access,
-- so these grants are only needed in self-hosted environments
-- where a dedicated impactforge_app role is created.
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'impactforge_app') THEN
    EXECUTE 'GRANT USAGE ON SCHEMA public TO impactforge_app';
    EXECUTE 'GRANT USAGE ON SCHEMA protected TO impactforge_app';
    EXECUTE 'GRANT USAGE ON SCHEMA application TO impactforge_app';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO impactforge_app';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA protected TO impactforge_app';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA application TO impactforge_app';
    RAISE NOTICE 'Granted permissions to impactforge_app role';
  ELSE
    RAISE NOTICE 'Role impactforge_app does not exist — skipping grants (admin user has full access)';
  END IF;
END
$$;

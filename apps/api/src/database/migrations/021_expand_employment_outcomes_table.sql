-- Migration 019: Expand Employment Outcomes Table
-- Purpose: Add missing variables (190-224) to the existing employment_outcomes table

ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS employer_industry TEXT;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS occupation_code TEXT;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS employment_type TEXT;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS is_full_time BOOLEAN;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS status_type TEXT; -- Permanent/Temp/Seasonal
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS expected_weekly_hours INTEGER;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS benefits_offered TEXT;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS worksite_location TEXT;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS work_mode TEXT; -- Remote/Hybrid/On-site
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS recovery_friendly BOOLEAN DEFAULT FALSE;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS second_chance BOOLEAN DEFAULT FALSE;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS is_union_job BOOLEAN DEFAULT FALSE;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS placement_quality TEXT;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS employed_at_30_days BOOLEAN;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS employed_at_60_days BOOLEAN;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS employed_at_180_days BOOLEAN;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS employed_at_365_days BOOLEAN;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS retention_verification_date DATE;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS wage_at_30_days NUMERIC;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS wage_at_90_days NUMERIC;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS wage_at_6_months NUMERIC;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS promotion_received BOOLEAN DEFAULT FALSE;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS promotion_date DATE;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS increase_in_hours BOOLEAN DEFAULT FALSE;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS benefits_gained BOOLEAN DEFAULT FALSE;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS job_satisfaction INTEGER;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS employer_satisfaction INTEGER;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS reason_ended TEXT;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS date_ended DATE;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE application.employment_outcomes ADD COLUMN IF NOT EXISTS updated_by UUID;

-- RLS Policy
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'employment_outcomes' 
        AND policyname = 'tenant_isolation'
    ) THEN
        CREATE POLICY tenant_isolation ON application.employment_outcomes
        FOR ALL USING (tenant_id = current_setting('app.current_tenant')::uuid)
        WITH CHECK (tenant_id = current_setting('app.current_tenant')::uuid);
    END IF;
END $$;

-- Audit Trigger
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_employment_outcomes') THEN
        CREATE TRIGGER audit_employment_outcomes
        AFTER INSERT OR UPDATE OR DELETE ON application.employment_outcomes
        FOR EACH ROW EXECUTE FUNCTION protected.audit_trigger_fn();
    END IF;
END $$;

-- Updated At Trigger
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_employment_outcomes_updated_at') THEN
        CREATE TRIGGER set_employment_outcomes_updated_at
        BEFORE UPDATE ON application.employment_outcomes
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

COMMENT ON TABLE application.employment_outcomes IS 'Tracks employment placement and retention milestones for participants.';

-- Migration 018: Create Follow-ups Table
-- Purpose: Add protected.follow_ups table to track longitudinal outcomes and supportive service progress (variables 225-240, 255-266)

CREATE TABLE IF NOT EXISTS protected.follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  participant_id UUID NOT NULL REFERENCES protected.participants(id),
  
  -- Tracking fields (255-258)
  due_date DATE NOT NULL,
  completed_date DATE,
  method TEXT,
  status TEXT DEFAULT 'pending',
  
  -- Outcomes (225-240 mapped to a JSONB object for flexibility)
  outcome_metrics JSONB DEFAULT '{}'::jsonb,
  
  -- Longitudinal Data (259-262)
  employment_at_follow_up BOOLEAN,
  wage_at_follow_up NUMERIC,
  education_status TEXT,
  housing_status TEXT,
  
  -- Notes & Progress (263, 265-266)
  continued_service_needs TEXT,
  long_term_goal_progress TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- RLS & Audit
ALTER TABLE protected.follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON protected.follow_ups
  USING (tenant_id = (current_setting('app.current_tenant'))::uuid)
  WITH CHECK (tenant_id = (current_setting('app.current_tenant'))::uuid);

CREATE TRIGGER audit_follow_ups
  AFTER INSERT OR UPDATE OR DELETE ON protected.follow_ups
  FOR EACH ROW EXECUTE FUNCTION protected.audit_trigger_fn();

CREATE TRIGGER set_follow_ups_updated_at
  BEFORE UPDATE ON protected.follow_ups
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Comments
COMMENT ON TABLE protected.follow_ups IS 'Tracks longitudinal follow-up data and service outcomes for participants.';
COMMENT ON COLUMN protected.follow_ups.outcome_metrics IS 'Stores boolean indicators for outcomes like housing, childcare, resume completion, etc. (Variables 225-240)';

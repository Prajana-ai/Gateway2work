-- Migration 016: Create Trainings Table
-- Purpose: Add protected.trainings table to track "Training and credential attainment" (variables 174-189)

CREATE TABLE IF NOT EXISTS protected.trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  participant_id UUID NOT NULL REFERENCES protected.participants(id) ON DELETE CASCADE,
  
  -- Program Details
  program_name TEXT,                          -- 174
  provider TEXT,                              -- 175
  start_date DATE,                            -- 176
  end_date DATE,                              -- 177
  is_completed BOOLEAN DEFAULT FALSE,         -- 178
  completion_date DATE,                       -- 179
  
  -- Outcomes and Credentials
  credential_earned TEXT,                     -- 180
  credential_type TEXT,                       -- 181
  license_earned TEXT,                        -- 182
  apprenticeship_participation BOOLEAN,       -- 183
  internship_participation BOOLEAN,           -- 184
  wbl_participation BOOLEAN,                  -- 185
  ojt_participation BOOLEAN,                  -- 186
  total_hours INTEGER,                        -- 187
  stipend_provided BOOLEAN,                   -- 188
  outcome TEXT,                               -- 189
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- RLS Enforcement
ALTER TABLE protected.trainings ENABLE ROW LEVEL SECURITY;

-- Audit Trigger
CREATE TRIGGER set_trainings_updated_at
  BEFORE UPDATE ON protected.trainings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Audit Log Trigger (if public.audit_trigger exists, following 006_audit-triggers.sql pattern)
-- Assuming triggers are added to all protected tables.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'audit_trigger') THEN
    CREATE TRIGGER audit_trainings
      AFTER INSERT OR UPDATE OR DELETE ON protected.trainings
      FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trainings_participant_id ON protected.trainings (participant_id);
CREATE INDEX IF NOT EXISTS idx_trainings_tenant_id ON protected.trainings (tenant_id);

-- Comments for documentation mapping
COMMENT ON TABLE protected.trainings IS 'Tracks Training and credential attainment for participants (Variables 174-189)';
COMMENT ON COLUMN protected.trainings.program_name IS '174: Name of the training program';
COMMENT ON COLUMN protected.trainings.provider IS '175: Name of the training provider';
COMMENT ON COLUMN protected.trainings.start_date IS '176: Start date of training';
COMMENT ON COLUMN protected.trainings.end_date IS '177: End date of training';
COMMENT ON COLUMN protected.trainings.is_completed IS '178: Whether the training was completed';
COMMENT ON COLUMN protected.trainings.completion_date IS '179: Date of training completion';
COMMENT ON COLUMN protected.trainings.credential_earned IS '180: Name of credential earned';
COMMENT ON COLUMN protected.trainings.credential_type IS '181: Type of credential earned';
COMMENT ON COLUMN protected.trainings.license_earned IS '182: Name of license earned';
COMMENT ON COLUMN protected.trainings.apprenticeship_participation IS '183: Participation in apprenticeship';
COMMENT ON COLUMN protected.trainings.internship_participation IS '184: Participation in internship';
COMMENT ON COLUMN protected.trainings.wbl_participation IS '185: Participation in work-based learning';
COMMENT ON COLUMN protected.trainings.ojt_participation IS '186: Participation in on-the-job training';
COMMENT ON COLUMN protected.trainings.total_hours IS '187: Total hours of training';
COMMENT ON COLUMN protected.trainings.stipend_provided IS '188: Whether a stipend was provided';
COMMENT ON COLUMN protected.trainings.outcome IS '189: Outcome of the training';

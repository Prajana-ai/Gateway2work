-- Migration 003: Protected schema tables (PHI / 42 CFR Part 2)

CREATE TABLE protected.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  external_ehr_id TEXT,
  referral_source TEXT,
  referral_date TIMESTAMPTZ,
  demographics JSONB NOT NULL DEFAULT '{}',
  consent_42cfr BOOLEAN DEFAULT false,
  consent_expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'inactive', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(tenant_id, external_ehr_id)
);

CREATE TABLE protected.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  participant_id UUID REFERENCES protected.participants(id) ON DELETE CASCADE,
  provider_agency_id UUID,
  referral_status TEXT DEFAULT 'pending'
    CHECK (referral_status IN ('pending', 'active', 'completed', 'declined')),
  notes TEXT,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

CREATE TABLE protected.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  participant_id UUID NOT NULL REFERENCES protected.participants(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL,
  raw_responses JSONB NOT NULL,
  computed_summary JSONB,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE protected.encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  participant_id UUID NOT NULL REFERENCES protected.participants(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL,
  encounter_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  notes TEXT,
  billable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

CREATE TABLE protected.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  performed_by UUID,
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated_at trigger for protected tables
CREATE TRIGGER set_participants_updated_at
  BEFORE UPDATE ON protected.participants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

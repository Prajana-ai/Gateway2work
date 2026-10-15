-- Migration 012: Restructure Enrollments and Referrals (idempotent)
--
-- Original version referenced `protected.clients`. After the global
-- clients->participants rename, fresh databases create `protected.participants`
-- in migration 003, so this file would fail with "relation does not exist".
-- This rewrite pivots on whichever participant-table name currently exists
-- and uses IF EXISTS / IF NOT EXISTS guards so it can run on both fresh and
-- legacy schemas. node-pg-migrate tracks by filename, so environments where
-- this migration already succeeded will skip it.

DO $$
DECLARE
  participant_table_qualified TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'protected' AND table_name = 'clients') THEN
    participant_table_qualified := 'protected.clients';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'protected' AND table_name = 'participants') THEN
    participant_table_qualified := 'protected.participants';
  ELSE
    RAISE EXCEPTION 'Neither protected.clients nor protected.participants exists';
  END IF;

  -- 1. Drop referral_* columns if they were placed on the participant table
  EXECUTE format(
    'ALTER TABLE %s DROP COLUMN IF EXISTS referral_source, DROP COLUMN IF EXISTS referral_date, DROP COLUMN IF EXISTS referral_type',
    participant_table_qualified
  );

  -- 2. Add provider_agency_name to referrals (idempotent)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'protected' AND table_name = 'referrals' AND column_name = 'provider_agency_name') THEN
    ALTER TABLE protected.referrals ADD COLUMN provider_agency_name TEXT;
  END IF;

  -- 3. Create enrollments table if not already present
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables
                 WHERE table_schema = 'protected' AND table_name = 'enrollments') THEN
    EXECUTE format($f$
      CREATE TABLE protected.enrollments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        participant_id UUID NOT NULL REFERENCES %s(id) ON DELETE CASCADE,
        referral_id UUID REFERENCES protected.referrals(id) ON DELETE SET NULL,
        referral_source TEXT,
        referral_date TIMESTAMPTZ,
        referral_type TEXT,
        program_enrolled_in TEXT,
        enrollment_date TIMESTAMPTZ,
        intake_completion_date TIMESTAMPTZ,
        eligibility_determination TEXT,
        eligibility_date TIMESTAMPTZ,
        reason_not_eligible TEXT,
        cohort_number TEXT,
        funding_source_tied_to_participant TEXT,
        recruitment_source TEXT,
        assessment_date TIMESTAMPTZ,
        ips_participant_established_date TIMESTAMPTZ,
        case_management_established_participant_date TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by UUID,
        updated_by UUID
      )
    $f$, participant_table_qualified);
  END IF;
END $$;

-- Trigger (idempotent — DROP IF EXISTS then CREATE)
DROP TRIGGER IF EXISTS set_enrollments_updated_at ON protected.enrollments;
CREATE TRIGGER set_enrollments_updated_at
  BEFORE UPDATE ON protected.enrollments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Index (idempotent)
CREATE INDEX IF NOT EXISTS idx_enrollments_participant_id ON protected.enrollments (participant_id);

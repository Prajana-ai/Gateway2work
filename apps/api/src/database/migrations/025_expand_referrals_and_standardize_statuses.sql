-- Migration 025: Expand referrals and standardize statuses
--
-- 1. Adds referral_date, referral_type, and updated_at to protected.referrals
-- 2. Standardizes status options across participants and referrals to:
--    ('pending', 'active', 'completed', 'declined')
-- 3. Migrates 'inactive' participants to 'declined'

BEGIN;

-- Part 1: Expand Referrals Table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'protected' AND table_name = 'referrals' AND column_name = 'referral_date') THEN
    ALTER TABLE protected.referrals ADD COLUMN referral_date TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'protected' AND table_name = 'referrals' AND column_name = 'referral_type') THEN
    ALTER TABLE protected.referrals ADD COLUMN referral_type TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'protected' AND table_name = 'referrals' AND column_name = 'updated_at') THEN
    ALTER TABLE protected.referrals ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Part 2: Add trigger for automatic updates to referrals
DROP TRIGGER IF EXISTS set_referrals_updated_at ON protected.referrals;
CREATE TRIGGER set_referrals_updated_at
  BEFORE UPDATE ON protected.referrals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Part 3: Standardize Participants Status
-- Remove old constraint (which included 'inactive')
ALTER TABLE protected.participants DROP CONSTRAINT IF EXISTS participants_status_check;

-- Migrate data: 'inactive' becomes 'declined' for consistency with referrals
UPDATE protected.participants SET status = 'declined' WHERE status = 'inactive';

-- Add new standardized constraint
ALTER TABLE protected.participants ADD CONSTRAINT participants_status_check 
  CHECK (status IN ('pending', 'active', 'completed', 'declined'));

-- Part 4: Ensure Referrals Status Constraint matches
ALTER TABLE protected.referrals DROP CONSTRAINT IF EXISTS referrals_referral_status_check;
ALTER TABLE protected.referrals ADD CONSTRAINT referrals_referral_status_check 
  CHECK (referral_status IN ('pending', 'active', 'completed', 'declined'));

COMMIT;

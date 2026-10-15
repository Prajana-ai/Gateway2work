-- Migration 017: Rename client_id to participant_id in enrollments
-- Purpose: Standardize naming across the platform
-- Idempotent: safe to run even if column was already named participant_id
--   (e.g., on DBs where 012_wfd-data-dictionary-tables created enrollments with participant_id directly)

DO $$
BEGIN
  -- Rename column only if client_id still exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'protected'
      AND table_name   = 'enrollments'
      AND column_name  = 'client_id'
  ) THEN
    ALTER TABLE protected.enrollments RENAME COLUMN client_id TO participant_id;
    RAISE NOTICE 'Renamed enrollments.client_id -> participant_id';
  ELSE
    RAISE NOTICE 'enrollments.participant_id already exists, skipping rename';
  END IF;

  -- Rename index only if old name still exists
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'protected'
      AND tablename  = 'enrollments'
      AND indexname  = 'idx_enrollments_client_id'
  ) THEN
    ALTER INDEX protected.idx_enrollments_client_id RENAME TO idx_enrollments_participant_id;
  END IF;

  -- Rename FK constraint only if old name still exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema     = 'protected'
      AND table_name       = 'enrollments'
      AND constraint_name  = 'enrollments_client_id_fkey'
      AND constraint_type  = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE protected.enrollments
      RENAME CONSTRAINT enrollments_client_id_fkey TO enrollments_participant_id_fkey;
  END IF;
END $$;

-- Comment for documentation
COMMENT ON COLUMN protected.enrollments.participant_id IS 'Unique identifier of the participant (Variable 1)';

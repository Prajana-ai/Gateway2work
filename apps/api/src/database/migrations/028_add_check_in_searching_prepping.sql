-- Migration 028: Add hours_searching and hours_prepping to participant_check_ins
--

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'application' AND table_name = 'participant_check_ins' AND column_name = 'hours_searching') THEN
    ALTER TABLE application.participant_check_ins ADD COLUMN hours_searching SMALLINT NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema = 'application' AND table_name = 'participant_check_ins' AND column_name = 'hours_prepping') THEN
    ALTER TABLE application.participant_check_ins ADD COLUMN hours_prepping SMALLINT NOT NULL DEFAULT 0;
  END IF;
END $$;

COMMIT;

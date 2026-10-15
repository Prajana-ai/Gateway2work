-- Migration 014: Idempotent fixup for the clients -> participants rename
--
-- Replaces the broken migration 013. Two database states to handle:
--   1. Fresh databases: migrations 003-012 ran against the post-rename source,
--      so the table is already called `participants`. This migration is a no-op.
--   2. Legacy databases: ran the original `clients` migrations long ago, then
--      had their migration files rewritten by the refactor's global rename.
--      Table is still `clients`. This migration renames the table, the related
--      FK columns, indexes, and the audit trigger.
--
-- Triggers and RLS policies attached to the renamed table are carried forward
-- automatically by Postgres on ALTER TABLE ... RENAME, so they don't need to
-- be dropped/recreated. Only the trigger name itself is updated for clarity.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'protected' AND table_name = 'clients'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'protected' AND table_name = 'participants'
  ) THEN
    RAISE NOTICE 'Legacy schema detected: renaming protected.clients to protected.participants';

    ALTER TABLE protected.clients RENAME TO participants;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='protected' AND table_name='referrals' AND column_name='client_id') THEN
      ALTER TABLE protected.referrals RENAME COLUMN client_id TO participant_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='protected' AND table_name='assessments' AND column_name='client_id') THEN
      ALTER TABLE protected.assessments RENAME COLUMN client_id TO participant_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='protected' AND table_name='encounters' AND column_name='client_id') THEN
      ALTER TABLE protected.encounters RENAME COLUMN client_id TO participant_id;
    END IF;

    -- Human-readable ID column on participants itself (from migration 011)
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='protected' AND table_name='participants' AND column_name='client_id') THEN
      ALTER TABLE protected.participants RENAME COLUMN client_id TO participant_id;
    END IF;

    -- Indexes (don't auto-rename with the table)
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='protected' AND indexname='clients_pkey') THEN
      ALTER INDEX protected.clients_pkey RENAME TO participants_pkey;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='protected' AND indexname='clients_tenant_id_external_ehr_id_key') THEN
      ALTER INDEX protected.clients_tenant_id_external_ehr_id_key RENAME TO participants_tenant_id_external_ehr_id_key;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='protected' AND indexname='idx_clients_client_id_tenant') THEN
      ALTER INDEX protected.idx_clients_client_id_tenant RENAME TO idx_participants_participant_id_tenant;
    END IF;

    -- Audit trigger name (defined in migration 006 as audit_clients in the original)
    IF EXISTS (
      SELECT 1 FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'protected' AND c.relname = 'participants' AND t.tgname = 'audit_clients'
    ) THEN
      ALTER TRIGGER audit_clients ON protected.participants RENAME TO audit_participants;
    END IF;

  ELSIF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'protected' AND table_name = 'participants'
  ) THEN
    RAISE NOTICE 'Fresh schema: protected.participants already exists, no rename needed';
  ELSE
    RAISE EXCEPTION 'Neither protected.clients nor protected.participants found — unexpected schema state';
  END IF;
END $$;

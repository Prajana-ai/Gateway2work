-- Migration 027: Create participant_check_ins table

CREATE TABLE IF NOT EXISTS application.participant_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  participant_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  feeling SMALLINT NOT NULL CHECK (feeling BETWEEN 1 AND 5),
  employment_status TEXT NOT NULL CHECK (employment_status IN ('working', 'searching', 'not_searching')),
  hours_worked SMALLINT NOT NULL DEFAULT 0,
  challenges TEXT,
  needs_help JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE application.participant_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.participant_check_ins FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON application.participant_check_ins
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant')::UUID
    AND (
      current_setting('app.current_role', true) != 'participant'
      OR participant_id = current_setting('app.current_user_id', true)::UUID
    )
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant')::UUID
    AND (
      current_setting('app.current_role', true) != 'participant'
      OR participant_id = current_setting('app.current_user_id', true)::UUID
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_check_ins_participant
  ON application.participant_check_ins (tenant_id, participant_id, date DESC);

COMMENT ON TABLE application.participant_check_ins IS
  'Weekly self-reported check-ins submitted by participants.';

-- Scheduling / Calendar Events
CREATE TABLE application.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('appointment', 'interview', 'check_in', 'assessment', 'meeting', 'other')),
  participant_id UUID,
  staff_id UUID,
  rfe_id UUID,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  is_virtual BOOLEAN DEFAULT false,
  meeting_url TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')),
  reminder_sent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- EHR Provider configurations
CREATE TABLE application.ehr_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL, -- 'csv', 'api', 'hl7', 'fhir'
  config JSONB NOT NULL DEFAULT '{}', -- connection details, field mappings
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EHR Import logs
CREATE TABLE application.ehr_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  provider_id UUID REFERENCES application.ehr_providers(id),
  import_type TEXT NOT NULL, -- 'manual', 'scheduled', 'webhook'
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  records_total INTEGER DEFAULT 0,
  records_imported INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_details JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- EHR Field mappings (per provider)
CREATE TABLE application.ehr_field_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES application.ehr_providers(id) ON DELETE CASCADE,
  source_field TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_field TEXT NOT NULL,
  transform TEXT, -- 'direct', 'date_format', 'lookup', 'concat', 'custom'
  transform_config JSONB,
  is_required BOOLEAN DEFAULT false,
  UNIQUE(provider_id, source_field)
);

-- RLS + indexes for all new tables
ALTER TABLE application.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.events FORCE ROW LEVEL SECURITY;
ALTER TABLE application.ehr_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.ehr_providers FORCE ROW LEVEL SECURITY;
ALTER TABLE application.ehr_import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.ehr_import_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON application.events
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);
CREATE POLICY tenant_isolation ON application.ehr_providers
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);
CREATE POLICY tenant_isolation ON application.ehr_import_logs
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_events_participant ON application.events (tenant_id, participant_id);
CREATE INDEX idx_events_staff ON application.events (tenant_id, staff_id);
CREATE INDEX idx_events_time ON application.events (tenant_id, start_time);
CREATE INDEX idx_ehr_import_logs_provider ON application.ehr_import_logs (provider_id);

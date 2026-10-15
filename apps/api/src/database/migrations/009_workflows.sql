-- Workflow templates define the pipeline stages
CREATE TABLE application.workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  stages JSONB NOT NULL, -- array of { name, order, type, conditions, auto_tasks, next_stage_trigger }
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow instances track a participant's progress through a template
CREATE TABLE application.workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  template_id UUID REFERENCES application.workflow_templates(id),
  participant_id UUID NOT NULL,
  current_stage TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  stage_data JSONB DEFAULT '{}', -- per-stage completion data
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_by UUID
);

-- RLS + indexes
ALTER TABLE application.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.workflow_templates FORCE ROW LEVEL SECURITY;
ALTER TABLE application.workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.workflow_instances FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON application.workflow_templates
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation ON application.workflow_instances
  FOR ALL USING (tenant_id = current_setting('app.current_tenant')::UUID)
  WITH CHECK (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE INDEX idx_workflow_instances_participant ON application.workflow_instances (tenant_id, participant_id);
CREATE INDEX idx_workflow_instances_status ON application.workflow_instances (tenant_id, status);

-- Seed the default TSRG workflow template
-- Uses a placeholder tenant_id (00000000-0000-0000-0000-000000000000) as a system-level template;
-- tenants copy or reference this upon onboarding.
INSERT INTO application.workflow_templates (id, tenant_id, name, description, stages, is_active)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'TSRG Default Pipeline',
  'Standard TSRG workflow: Referral → Assessment → Workforce Plan → Employer Match → Follow-Up',
  '[
    {
      "name": "Referral & Intake",
      "order": 1,
      "type": "referral_intake",
      "conditions": [
        { "field": "referral_received", "operator": "eq", "value": true },
        { "field": "intake_completed", "operator": "eq", "value": true }
      ],
      "auto_tasks": [
        { "description": "Review referral", "owner_type": "staff", "due_days": 3 },
        { "description": "Schedule intake meeting", "owner_type": "staff", "due_days": 5 },
        { "description": "Verify consent", "owner_type": "staff", "due_days": 5 }
      ],
      "next_stage_trigger": "manual"
    },
    {
      "name": "Assessments",
      "order": 2,
      "type": "assessment",
      "conditions": [
        { "field": "assessments_completed", "operator": "gte", "value": 3 }
      ],
      "auto_tasks": [
        { "description": "Complete skills assessment", "owner_type": "staff", "due_days": 7 },
        { "description": "Complete interests inventory", "owner_type": "staff", "due_days": 7 },
        { "description": "Complete barriers assessment", "owner_type": "staff", "due_days": 7 }
      ],
      "next_stage_trigger": "auto"
    },
    {
      "name": "Workforce Plan",
      "order": 3,
      "type": "workforce_plan",
      "conditions": [
        { "field": "workforce_plan_created", "operator": "eq", "value": true }
      ],
      "auto_tasks": [
        { "description": "Create workforce development plan", "owner_type": "staff", "due_days": 10 },
        { "description": "Review plan with participant", "owner_type": "staff", "due_days": 14 },
        { "description": "Set short-term goals", "owner_type": "staff", "due_days": 14 }
      ],
      "next_stage_trigger": "auto"
    },
    {
      "name": "Employer Matching",
      "order": 4,
      "type": "employer_match",
      "conditions": [
        { "field": "employer_matches", "operator": "gte", "value": 1 }
      ],
      "auto_tasks": [
        { "description": "Search RFE directory", "owner_type": "staff", "due_days": 7 },
        { "description": "Submit applications", "owner_type": "staff", "due_days": 14 },
        { "description": "Schedule interviews", "owner_type": "staff", "due_days": 21 }
      ],
      "next_stage_trigger": "auto"
    },
    {
      "name": "Follow-Up",
      "order": 5,
      "type": "follow_up",
      "conditions": [],
      "auto_tasks": [
        { "description": "30-day check-in", "owner_type": "staff", "due_days": 30 },
        { "description": "90-day check-in", "owner_type": "staff", "due_days": 90 },
        { "description": "Update employment status", "owner_type": "staff", "due_days": 90 }
      ],
      "next_stage_trigger": "manual"
    }
  ]'::jsonb,
  true
);

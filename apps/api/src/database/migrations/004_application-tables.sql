-- Migration 004: Application schema tables (de-identified / analytics)

CREATE TABLE application.workforce_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  participant_id UUID NOT NULL,
  long_term_goal TEXT,
  short_term_goals JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

CREATE TABLE application.plan_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES application.workforce_plans(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  description TEXT NOT NULL,
  owner_type TEXT CHECK (owner_type IN ('staff', 'participant')),
  assigned_to UUID,
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE application.recovery_friendly_employers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  sector TEXT,
  locations JSONB DEFAULT '[]',
  is_rfe_certified BOOLEAN DEFAULT true,
  trainee_readiness TEXT CHECK (trainee_readiness IN ('yes', 'limited', 'no')),
  contact_info JSONB DEFAULT '{}',
  notes TEXT,
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE application.participant_employer_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  participant_id UUID NOT NULL,
  rfe_id UUID NOT NULL REFERENCES application.recovery_friendly_employers(id) ON DELETE CASCADE,
  application_status TEXT DEFAULT 'interested'
    CHECK (application_status IN ('interested', 'applied', 'interviewing', 'offered')),
  outcome TEXT CHECK (outcome IN ('hired', 'not_hired', 'in_training', 'withdrawn')),
  applied_date TIMESTAMPTZ,
  outcome_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE application.form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  vertical TEXT,
  assessment_type TEXT,
  json_schema JSONB NOT NULL,
  ui_schema JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE application.assessment_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  participant_id UUID NOT NULL,
  assessment_id UUID NOT NULL,
  assessment_type TEXT NOT NULL,
  scores JSONB NOT NULL,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated_at triggers
CREATE TRIGGER set_workforce_plans_updated_at
  BEFORE UPDATE ON application.workforce_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_form_templates_updated_at
  BEFORE UPDATE ON application.form_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

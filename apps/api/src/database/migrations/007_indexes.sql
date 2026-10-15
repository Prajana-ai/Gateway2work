-- Migration 007: Indexes for performance

-- GIN indexes on JSONB columns
CREATE INDEX idx_participants_demographics ON protected.participants USING GIN (demographics);
CREATE INDEX idx_assessments_raw_responses ON protected.assessments USING GIN (raw_responses);
CREATE INDEX idx_assessments_computed_summary ON protected.assessments USING GIN (computed_summary);
CREATE INDEX idx_workforce_plans_short_term_goals ON application.workforce_plans USING GIN (short_term_goals);
CREATE INDEX idx_rfe_locations ON application.recovery_friendly_employers USING GIN (locations);
CREATE INDEX idx_form_templates_json_schema ON application.form_templates USING GIN (json_schema);
CREATE INDEX idx_assessment_summaries_scores ON application.assessment_summaries USING GIN (scores);

-- Composite indexes on (tenant_id, status) for common queries
CREATE INDEX idx_participants_tenant_status ON protected.participants (tenant_id, status);
CREATE INDEX idx_referrals_tenant_status ON protected.referrals (tenant_id, referral_status);
CREATE INDEX idx_workforce_plans_tenant_status ON application.workforce_plans (tenant_id, status);
CREATE INDEX idx_plan_tasks_tenant_status ON application.plan_tasks (tenant_id, status);
CREATE INDEX idx_matches_tenant_status ON application.participant_employer_matches (tenant_id, application_status);

-- Foreign key and lookup indexes
CREATE INDEX idx_referrals_participant_id ON protected.referrals (participant_id);
CREATE INDEX idx_assessments_participant_id ON protected.assessments (participant_id);
CREATE INDEX idx_assessments_type ON protected.assessments (tenant_id, assessment_type);
CREATE INDEX idx_encounters_participant_id ON protected.encounters (participant_id);
CREATE INDEX idx_encounters_staff_date ON protected.encounters (staff_id, encounter_date);
CREATE INDEX idx_plan_tasks_plan_id ON application.plan_tasks (plan_id);
CREATE INDEX idx_matches_participant_id ON application.participant_employer_matches (participant_id);
CREATE INDEX idx_matches_rfe_id ON application.participant_employer_matches (rfe_id);
CREATE INDEX idx_assessment_summaries_participant ON application.assessment_summaries (tenant_id, participant_id);
CREATE INDEX idx_workforce_plans_participant ON application.workforce_plans (tenant_id, participant_id);

-- Trigram index for fuzzy participant search
CREATE INDEX idx_participants_demographics_trgm ON protected.participants
  USING GIN ((demographics->>'first_name') gin_trgm_ops);
CREATE INDEX idx_participants_demographics_last_trgm ON protected.participants
  USING GIN ((demographics->>'last_name') gin_trgm_ops);

-- Audit log indexes
CREATE INDEX idx_audit_logs_tenant_table ON protected.audit_logs (tenant_id, table_name);
CREATE INDEX idx_audit_logs_record ON protected.audit_logs (record_id);
CREATE INDEX idx_audit_logs_performed_at ON protected.audit_logs (performed_at);

-- RFE search indexes
CREATE INDEX idx_rfe_tenant_sector ON application.recovery_friendly_employers (tenant_id, sector);
CREATE INDEX idx_rfe_name_trgm ON application.recovery_friendly_employers USING GIN (name gin_trgm_ops);

-- Refresh token cleanup
CREATE INDEX idx_refresh_tokens_user ON public.refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_expires ON public.refresh_tokens (expires_at) WHERE is_revoked = false;

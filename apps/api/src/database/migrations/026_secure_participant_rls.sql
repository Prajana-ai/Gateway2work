-- Migration 026: Enforce RLS policies for participant role

-- Enable Row Level Security on all targeted tables (just in case)
ALTER TABLE protected.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE protected.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE protected.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE protected.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE protected.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE protected.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE protected.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.workforce_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.plan_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.participant_employer_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.assessment_summaries ENABLE ROW LEVEL SECURITY;

-- 1. protected.participants
DROP POLICY IF EXISTS tenant_isolation ON protected.participants;
CREATE POLICY tenant_isolation ON protected.participants
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant')::UUID
    AND (
      current_setting('app.current_role', true) != 'participant'
      OR id = current_setting('app.current_user_id', true)::UUID
    )
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant')::UUID
    AND (
      current_setting('app.current_role', true) != 'participant'
      OR id = current_setting('app.current_user_id', true)::UUID
    )
  );

DROP POLICY IF EXISTS consent_42cfr_gate ON protected.participants;
CREATE POLICY consent_42cfr_gate ON protected.participants
  FOR SELECT USING (
    (
      current_setting('app.current_role', true) != 'participant'
      AND consent_42cfr = true 
      AND consent_expires_at > NOW()
    )
    OR current_setting('app.current_role', true) = 'compliance_admin'
    OR current_setting('app.consent_management_mode', true) = 'true'
  );

-- 2. protected.referrals
DROP POLICY IF EXISTS tenant_isolation ON protected.referrals;
CREATE POLICY tenant_isolation ON protected.referrals
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

-- 3. protected.assessments
DROP POLICY IF EXISTS tenant_isolation ON protected.assessments;
CREATE POLICY tenant_isolation ON protected.assessments
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

DROP POLICY IF EXISTS consent_42cfr_assessments ON protected.assessments;
CREATE POLICY consent_42cfr_assessments ON protected.assessments
  FOR SELECT USING (
    (
      current_setting('app.current_role', true) != 'participant'
      AND EXISTS (
        SELECT 1 FROM protected.participants c
        WHERE c.id = assessments.participant_id
          AND c.consent_42cfr = true
          AND c.consent_expires_at > NOW()
      )
    )
    OR current_setting('app.current_role', true) = 'compliance_admin'
  );

-- 4. protected.encounters
DROP POLICY IF EXISTS tenant_isolation ON protected.encounters;
CREATE POLICY tenant_isolation ON protected.encounters
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

DROP POLICY IF EXISTS consent_42cfr_encounters ON protected.encounters;
CREATE POLICY consent_42cfr_encounters ON protected.encounters
  FOR SELECT USING (
    (
      current_setting('app.current_role', true) != 'participant'
      AND EXISTS (
        SELECT 1 FROM protected.participants c
        WHERE c.id = encounters.participant_id
          AND c.consent_42cfr = true
          AND c.consent_expires_at > NOW()
      )
    )
    OR current_setting('app.current_role', true) = 'compliance_admin'
  );

-- 5. protected.trainings
DROP POLICY IF EXISTS tenant_isolation ON protected.trainings;
CREATE POLICY tenant_isolation ON protected.trainings
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

-- 6. protected.follow_ups
DROP POLICY IF EXISTS tenant_isolation ON protected.follow_ups;
CREATE POLICY tenant_isolation ON protected.follow_ups
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

-- 7. protected.enrollments
DROP POLICY IF EXISTS tenant_isolation ON protected.enrollments;
CREATE POLICY tenant_isolation ON protected.enrollments
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

-- 8. application.workforce_plans
DROP POLICY IF EXISTS tenant_isolation ON application.workforce_plans;
CREATE POLICY tenant_isolation ON application.workforce_plans
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

-- 9. application.plan_tasks
DROP POLICY IF EXISTS tenant_isolation ON application.plan_tasks;
CREATE POLICY tenant_isolation ON application.plan_tasks
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant')::UUID
    AND (
      current_setting('app.current_role', true) != 'participant'
      OR EXISTS (
        SELECT 1 FROM application.workforce_plans wp
        WHERE wp.id = plan_id 
          AND wp.participant_id = current_setting('app.current_user_id', true)::UUID
      )
    )
  )
  WITH CHECK (
    tenant_id = current_setting('app.current_tenant')::UUID
    AND (
      current_setting('app.current_role', true) != 'participant'
      OR EXISTS (
        SELECT 1 FROM application.workforce_plans wp
        WHERE wp.id = plan_id 
          AND wp.participant_id = current_setting('app.current_user_id', true)::UUID
      )
    )
  );

-- 10. application.participant_employer_matches
DROP POLICY IF EXISTS tenant_isolation ON application.participant_employer_matches;
CREATE POLICY tenant_isolation ON application.participant_employer_matches
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

-- 11. application.assessment_summaries
DROP POLICY IF EXISTS tenant_isolation ON application.assessment_summaries;
CREATE POLICY tenant_isolation ON application.assessment_summaries
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

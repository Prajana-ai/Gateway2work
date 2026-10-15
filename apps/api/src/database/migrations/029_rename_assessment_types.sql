-- Migration 029: Rename assessment type values
-- tsrg_skills       → current_work_profile
-- tsrg_interests    → workstyle_strengths
-- tsrg_barriers     → support_needs
--
-- The assessment_type column is plain TEXT in all three tables,
-- so a straight UPDATE is sufficient — no type casting needed.
-- This migration is idempotent: WHERE guards mean re-running is safe.

-- protected.assessments (PHI — raw responses + computed summary)
UPDATE protected.assessments
  SET assessment_type = 'current_work_profile'
  WHERE assessment_type = 'tsrg_skills';

UPDATE protected.assessments
  SET assessment_type = 'workstyle_strengths'
  WHERE assessment_type = 'tsrg_interests';

UPDATE protected.assessments
  SET assessment_type = 'support_needs'
  WHERE assessment_type = 'tsrg_barriers';

-- application.assessment_summaries (de-identified computed scores)
UPDATE application.assessment_summaries
  SET assessment_type = 'current_work_profile'
  WHERE assessment_type = 'tsrg_skills';

UPDATE application.assessment_summaries
  SET assessment_type = 'workstyle_strengths'
  WHERE assessment_type = 'tsrg_interests';

UPDATE application.assessment_summaries
  SET assessment_type = 'support_needs'
  WHERE assessment_type = 'tsrg_barriers';

-- application.form_templates (assessment type tag)
UPDATE application.form_templates
  SET assessment_type = 'current_work_profile'
  WHERE assessment_type = 'tsrg_skills';

UPDATE application.form_templates
  SET assessment_type = 'workstyle_strengths'
  WHERE assessment_type = 'tsrg_interests';

UPDATE application.form_templates
  SET assessment_type = 'support_needs'
  WHERE assessment_type = 'tsrg_barriers';

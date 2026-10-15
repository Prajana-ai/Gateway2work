-- Up Migration: 022_create_ips_fidelity_reviews.sql
-- Purpose: Support formal IPS Fidelity Reviews with 26 variables.

CREATE TABLE application.ips_fidelity_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  reviewer_id UUID REFERENCES public.staff(id),
  review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT CHECK (status IN ('draft', 'finalized')) DEFAULT 'draft',
  total_score INTEGER DEFAULT 0,
  
  -- Staffing (312-315)
  score_312_competitive_work INTEGER CHECK (score_312_competitive_work BETWEEN 1 AND 5),
  score_313_caseload_size INTEGER CHECK (score_313_caseload_size BETWEEN 1 AND 5),
  score_314_employment_staff INTEGER CHECK (score_314_employment_staff BETWEEN 1 AND 5),
  score_315_vocational_generalists INTEGER CHECK (score_315_vocational_generalists BETWEEN 1 AND 5),
  
  -- Organization (316-323)
  score_316_mh_integration INTEGER CHECK (score_316_mh_integration BETWEEN 1 AND 5),
  score_317_mh_contact INTEGER CHECK (score_317_mh_contact BETWEEN 1 AND 5),
  score_318_vr_collaboration INTEGER CHECK (score_318_vr_collaboration BETWEEN 1 AND 5),
  score_319_vocational_unit INTEGER CHECK (score_319_vocational_unit BETWEEN 1 AND 5),
  score_320_ips_supervisor INTEGER CHECK (score_320_ips_supervisor BETWEEN 1 AND 5),
  score_321_zero_exclusion INTEGER CHECK (score_321_zero_exclusion BETWEEN 1 AND 5),
  score_322_agency_promotion INTEGER CHECK (score_322_agency_promotion BETWEEN 1 AND 5),
  score_323_exec_support INTEGER CHECK (score_323_exec_support BETWEEN 1 AND 5),
  
  -- Services (324-337)
  score_324_work_incentive_planning INTEGER CHECK (score_324_work_incentive_planning BETWEEN 1 AND 5),
  score_325_disclosure INTEGER CHECK (score_325_disclosure BETWEEN 1 AND 5),
  score_326_vocational_assessment INTEGER CHECK (score_326_vocational_assessment BETWEEN 1 AND 5),
  score_327_rapid_job_search INTEGER CHECK (score_327_rapid_job_search BETWEEN 1 AND 5),
  score_328_individualized_job_search INTEGER CHECK (score_328_individualized_job_search BETWEEN 1 AND 5),
  score_329_employer_contact INTEGER CHECK (score_329_employer_contact BETWEEN 1 AND 5),
  score_330_employer_contact_quality INTEGER CHECK (score_330_employer_contact_quality BETWEEN 1 AND 5),
  score_331_job_diversity INTEGER CHECK (score_331_job_diversity BETWEEN 1 AND 5),
  score_332_employer_diversity INTEGER CHECK (score_332_employer_diversity BETWEEN 1 AND 5),
  score_333_competitive_jobs INTEGER CHECK (score_333_competitive_jobs BETWEEN 1 AND 5),
  score_334_individualized_follow_along INTEGER CHECK (score_334_individualized_follow_along BETWEEN 1 AND 5),
  score_335_time_unlimited_follow_along INTEGER CHECK (score_335_time_unlimited_follow_along BETWEEN 1 AND 5),
  score_336_community_services INTEGER CHECK (score_336_community_services BETWEEN 1 AND 5),
  score_337_assertive_engagement INTEGER CHECK (score_337_assertive_engagement BETWEEN 1 AND 5),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE application.ips_fidelity_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_ips_reviews ON application.ips_fidelity_reviews
  USING (tenant_id = (current_setting('app.current_tenant')::uuid));

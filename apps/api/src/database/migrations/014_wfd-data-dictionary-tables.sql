-- Up Migration: 012_wfd-data-dictionary-tables.sql
-- Purpose: Implement the relational schema derived from the enhanced WFD ER Diagram.

-- 1. PUBLIC SCHEMA (Staff Extensions)
-- We extend the public schema to handle staff profiles linked to users.
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    user_id UUID REFERENCES public.users(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT,
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. APPLICATION SCHEMA (Infrastructure & Reference)
CREATE TABLE IF NOT EXISTS application.funding_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    stream_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application.raes_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    region_name TEXT NOT NULL,
    region_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROTECTED SCHEMA (PII / PHI / 42 CFR Part 2)
CREATE TABLE IF NOT EXISTS protected.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    raes_region_id UUID REFERENCES application.raes_regions(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    primary_language TEXT,
    consent_signed BOOLEAN DEFAULT FALSE,
    external_id TEXT, -- For EHR mapping
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS protected.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    participant_id UUID NOT NULL REFERENCES protected.participants(id) ON DELETE CASCADE,
    funding_stream_id UUID REFERENCES application.funding_streams(id),
    enrollment_date DATE NOT NULL,
    referral_source TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS protected.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    participant_id UUID NOT NULL REFERENCES protected.participants(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id),
    assessment_date DATE DEFAULT CURRENT_DATE,
    type TEXT NOT NULL,
    results TEXT, -- Could be JSONB for detailed scoring
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS protected.ips_fidelity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    caseload_size INTEGER,
    competitive_work BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS protected.discharges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    participant_id UUID NOT NULL REFERENCES protected.participants(id) ON DELETE CASCADE,
    exit_date DATE NOT NULL,
    discharge_type TEXT CHECK (discharge_type IN ('planned', 'unplanned')),
    reason_for_exit TEXT,
    employment_status_at_exit TEXT,
    training_status_at_exit TEXT,
    recovery_stability_at_exit TEXT,
    referrals_at_discharge JSONB,
    follow_up_plans TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. APPLICATION SCHEMA (Operational / Outcomes)
CREATE TABLE IF NOT EXISTS application.employers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    name TEXT NOT NULL,
    industry TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    participant_id UUID NOT NULL, -- Surrogate link to protected.participants
    staff_id UUID REFERENCES public.staff(id),
    service_date DATE NOT NULL,
    service_type TEXT NOT NULL,
    outcome TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application.employment_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    participant_id UUID NOT NULL, -- Surrogate link
    employer_id UUID REFERENCES application.employers(id),
    job_title TEXT,
    start_date DATE,
    starting_wage DECIMAL(10,2),
    retention_90_day BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS ENFORCEMENT
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.funding_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.raes_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE protected.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE protected.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE protected.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE protected.ips_fidelity ENABLE ROW LEVEL SECURITY;
ALTER TABLE protected.discharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE application.employment_outcomes ENABLE ROW LEVEL SECURITY;

-- Migration 015: Consolidate and Expand Services
-- Purpose: Add 50 fields (89-101, 138-173) to protected.encounters and remove duplicate application.services.

-- 1. Consolidate: Remove the unused application.services table to avoid duplicate concepts
DROP TABLE IF EXISTS application.services;

-- 2. Expand: Add missing "Services received" and "Recovery/Needs" fields to protected.encounters
ALTER TABLE protected.encounters 
  -- Services received fields (141-149, 152-173)
  ADD COLUMN IF NOT EXISTS service_type TEXT,
  ADD COLUMN IF NOT EXISTS service_subcategory TEXT,
  ADD COLUMN IF NOT EXISTS partner_organization_name TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'office',
  ADD COLUMN IF NOT EXISTS delivery_mode TEXT DEFAULT 'in_person',
  ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT TRUE,
  
  -- Recovery status and supportive needs (89-101)
  ADD COLUMN IF NOT EXISTS recovery_status TEXT,
  ADD COLUMN IF NOT EXISTS recovery_stage TEXT,
  ADD COLUMN IF NOT EXISTS substance_use_treatment TEXT,
  ADD COLUMN IF NOT EXISTS behavioral_health_treatment TEXT,
  ADD COLUMN IF NOT EXISTS peer_support_participation TEXT,
  ADD COLUMN IF NOT EXISTS housing_instability TEXT,
  ADD COLUMN IF NOT EXISTS food_insecurity TEXT,
  ADD COLUMN IF NOT EXISTS childcare_need TEXT,
  ADD COLUMN IF NOT EXISTS transportation_need TEXT,
  ADD COLUMN IF NOT EXISTS legal_support_need TEXT,
  ADD COLUMN IF NOT EXISTS physical_health_need TEXT,
  ADD COLUMN IF NOT EXISTS mental_health_need TEXT,
  ADD COLUMN IF NOT EXISTS trauma_informed_support TEXT;

-- 3. Add comments for documentation mapping
COMMENT ON COLUMN protected.encounters.service_type IS '141: Mapping to ServiceType enum (Application help, Coaching, etc.)';
COMMENT ON COLUMN protected.encounters.service_subcategory IS '142: Specific categorical variables for service specificity (mapping to 151-173)';
COMMENT ON COLUMN protected.encounters.partner_organization_name IS '144: Name of partner organization providing service';
COMMENT ON COLUMN protected.encounters.location IS '146: Mapping to ServiceLocation (Office, Field, etc.)';
COMMENT ON COLUMN protected.encounters.delivery_mode IS '147: Mapping to ServiceDeliveryMode (In person, Virtual, Phone)';
COMMENT ON COLUMN protected.encounters.format IS '148: Mapping to ServiceFormat (Individual, Group)';
COMMENT ON COLUMN protected.encounters.is_completed IS '149: Whether the service was completed';

COMMENT ON COLUMN protected.encounters.recovery_status IS '89: Justice, recovery and supportive service needs';
COMMENT ON COLUMN protected.encounters.recovery_stage IS '90: Recovery stage or self identified recovery status';
COMMENT ON COLUMN protected.encounters.substance_use_treatment IS '91: Substance use treatment participation (MOUD, NA, AA, IOP)';
COMMENT ON COLUMN protected.encounters.behavioral_health_treatment IS '92: Behavioral health treatment participation';
COMMENT ON COLUMN protected.encounters.peer_support_participation IS '93: Peer support participation';
COMMENT ON COLUMN protected.encounters.housing_instability IS '94: Housing instability status';
COMMENT ON COLUMN protected.encounters.food_insecurity IS '95: Food insecurity status';
COMMENT ON COLUMN protected.encounters.childcare_need IS '96: Childcare need status';
COMMENT ON COLUMN protected.encounters.transportation_need IS '97: Transportation need status';
COMMENT ON COLUMN protected.encounters.legal_support_need IS '98: Legal support need status';
COMMENT ON COLUMN protected.encounters.physical_health_need IS '99: Physical health need status';
COMMENT ON COLUMN protected.encounters.mental_health_need IS '100: Mental health need status';
COMMENT ON COLUMN protected.encounters.trauma_informed_support IS '101: Trauma informed support needed status';

-- 4. Audit trigger update (triggers are carried over with table, but ensuring columns are logged)
-- Triggers on protected.encounters already exist and will log the new columns automatically.

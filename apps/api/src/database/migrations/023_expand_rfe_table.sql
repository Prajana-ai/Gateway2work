-- Up Migration: 021_expand_rfe_table.sql
-- Purpose: Expand the recovery_friendly_employers table with WFD partner variables.
-- Idempotent: all ADD COLUMN statements use IF NOT EXISTS

ALTER TABLE application.recovery_friendly_employers
  ADD COLUMN IF NOT EXISTS service_provider_id TEXT,
  ADD COLUMN IF NOT EXISTS service_provider_name TEXT,
  ADD COLUMN IF NOT EXISTS contact_person TEXT,
  ADD COLUMN IF NOT EXISTS contact_title TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS employer_address TEXT,
  ADD COLUMN IF NOT EXISTS partnership_start_date DATE,
  ADD COLUMN IF NOT EXISTS is_fair_chance BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS hiring_sectors TEXT,
  ADD COLUMN IF NOT EXISTS entry_level_openings TEXT,
  ADD COLUMN IF NOT EXISTS salary_range TEXT, -- ordinal: minimum wage, competitive wage, livable wage
  ADD COLUMN IF NOT EXISTS benefits_offered TEXT,
  ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hire_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS retention_90_day_count INTEGER DEFAULT 0;

-- Add industry column (aligned with PRD terminology; sector remains for legacy compatibility)
ALTER TABLE application.recovery_friendly_employers ADD COLUMN IF NOT EXISTS industry TEXT;

-- Back-fill industry from sector for any existing rows
UPDATE application.recovery_friendly_employers SET industry = sector WHERE industry IS NULL;


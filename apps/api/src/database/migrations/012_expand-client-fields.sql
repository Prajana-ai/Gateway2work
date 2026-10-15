-- Migration 011: Expand participant fields for Identity, Legal, Demographics and Socioeconomic status

-- Add top-level participant_id
ALTER TABLE protected.participants ADD COLUMN participant_id TEXT;
CREATE UNIQUE INDEX idx_participants_participant_id_tenant ON protected.participants (tenant_id, participant_id) WHERE participant_id IS NOT NULL;

-- Add JSONB columns for grouping
ALTER TABLE protected.participants ADD COLUMN legal_info JSONB DEFAULT '{}';
ALTER TABLE protected.participants ADD COLUMN socioeconomic JSONB DEFAULT '{}';

-- Add preferred_name and secondary fields to demographics if we want to keep some overlap or move them
-- For this migration, we'll assume they all go into the relevant JSONB blocks mentioned above.

-- Add comments for documentation
COMMENT ON COLUMN protected.participants.participant_id IS 'Unique human-readable ID for the participant, either manual or auto-generated';
COMMENT ON COLUMN protected.participants.legal_info IS 'JSONB block containing consent, ROI, and legal-related details';
COMMENT ON COLUMN protected.participants.socioeconomic IS 'JSONB block containing housing, transportation, and digital access details';

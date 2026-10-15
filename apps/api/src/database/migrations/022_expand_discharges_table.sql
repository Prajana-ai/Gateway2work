-- Migration 999: Expand discharges table with WFD Data Dictionary variables

ALTER TABLE protected.discharges 
ADD COLUMN IF NOT EXISTS completed_successfully BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS withdrew_voluntarily BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lost_contact BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS referred_to_another_program BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS incarcerated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hospitalized BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deceased BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS non_completion_workforce_exit BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS completion_workforce_exit BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS wage_at_exit DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS notes_at_exit TEXT;

-- Add comments for documentation based on WFD Data Dictionary IDs
COMMENT ON COLUMN protected.discharges.completed_successfully IS 'ID 243: Completed program successfully';
COMMENT ON COLUMN protected.discharges.withdrew_voluntarily IS 'ID 244: Withdrew voluntarily';
COMMENT ON COLUMN protected.discharges.lost_contact IS 'ID 245: Lost contact';
COMMENT ON COLUMN protected.discharges.referred_to_another_program IS 'ID 246: Referred to another program';
COMMENT ON COLUMN protected.discharges.incarcerated IS 'ID 247: Incarcerated';
COMMENT ON COLUMN protected.discharges.hospitalized IS 'ID 248: Hospitalized';
COMMENT ON COLUMN protected.discharges.deceased IS 'ID 249: Deceased';
COMMENT ON COLUMN protected.discharges.non_completion_workforce_exit IS 'ID 250: Non-completion of workforce program upon exit';
COMMENT ON COLUMN protected.discharges.completion_workforce_exit IS 'ID 251: Completion of workforce program upon exit';
COMMENT ON COLUMN protected.discharges.wage_at_exit IS 'ID 253: Wage at exit';
COMMENT ON COLUMN protected.discharges.notes_at_exit IS 'ID 254: Notes at exit';

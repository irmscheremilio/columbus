-- Update competitor status values to simpler naming
-- Old: 'active', 'pending_review', 'suggested', 'rejected'
-- New: 'proposed', 'tracking', 'denied'

-- First, update existing values to new naming
UPDATE competitors SET status = 'tracking' WHERE status = 'active';
UPDATE competitors SET status = 'proposed' WHERE status IN ('pending_review', 'suggested');
UPDATE competitors SET status = 'denied' WHERE status = 'rejected';

-- Drop the old check constraint and add new one
ALTER TABLE competitors DROP CONSTRAINT IF EXISTS competitors_status_check;
ALTER TABLE competitors ADD CONSTRAINT competitors_status_check
  CHECK (status IN ('proposed', 'tracking', 'denied'));

-- Set default to 'proposed' for auto-detected competitors
ALTER TABLE competitors ALTER COLUMN status SET DEFAULT 'proposed';

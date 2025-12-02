-- Migration: Refactor prompt regions to use array column
-- Replaces target_location, target_country, target_region with single target_regions array

-- Add new target_regions array column
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS target_regions TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Migrate existing data: if target_country has a value, add it to target_regions
UPDATE prompts
SET target_regions = ARRAY[LOWER(target_country)]
WHERE target_country IS NOT NULL AND target_country != '';

-- Drop old columns that are no longer needed
ALTER TABLE prompts DROP COLUMN IF EXISTS target_location;
ALTER TABLE prompts DROP COLUMN IF EXISTS target_country;
ALTER TABLE prompts DROP COLUMN IF EXISTS target_region;

-- Add comment for documentation
COMMENT ON COLUMN prompts.target_regions IS 'Array of ISO country codes (lowercase) where this prompt should be tested, e.g., [''us'', ''de'', ''uk'']. Empty array means use user''s actual location.';

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_prompts_target_regions ON prompts USING GIN (target_regions);

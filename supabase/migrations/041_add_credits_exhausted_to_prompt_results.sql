-- Add credits_exhausted column to prompt_results for tracking credit usage during scans
ALTER TABLE prompt_results
ADD COLUMN IF NOT EXISTS credits_exhausted BOOLEAN DEFAULT false;

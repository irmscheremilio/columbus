-- Add missing columns to fix_recommendations table
-- These are used by the recommendation engine

ALTER TABLE fix_recommendations
ADD COLUMN IF NOT EXISTS code_snippets JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS estimated_time TEXT,
ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard'));

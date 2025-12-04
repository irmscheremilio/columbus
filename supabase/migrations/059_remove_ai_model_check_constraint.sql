-- Migration: Remove ai_model CHECK constraint from prompt_results table
-- The ai_platforms table is the source of truth for valid platforms,
-- so this hardcoded constraint is unnecessary and causes issues when adding new platforms.

ALTER TABLE prompt_results DROP CONSTRAINT IF EXISTS prompt_results_ai_model_check;

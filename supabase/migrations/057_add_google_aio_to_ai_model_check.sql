-- Migration: Add google_aio to the ai_model CHECK constraint in prompt_results table

-- Drop the existing constraint
ALTER TABLE prompt_results DROP CONSTRAINT IF EXISTS prompt_results_ai_model_check;

-- Add the updated constraint including google_aio
ALTER TABLE prompt_results ADD CONSTRAINT prompt_results_ai_model_check
  CHECK (ai_model IN ('chatgpt', 'claude', 'gemini', 'perplexity', 'google_aio'));

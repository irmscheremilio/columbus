-- Add research_insight column to fix_recommendations table
-- This stores AI-generated research-backed insights specific to each recommendation

ALTER TABLE fix_recommendations
ADD COLUMN IF NOT EXISTS research_insight TEXT;

-- Add comment for documentation
COMMENT ON COLUMN fix_recommendations.research_insight IS 'AI-generated research-backed insight that explains why this recommendation matters, sourced from AEO research knowledge base';

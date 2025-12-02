-- Enhance visibility_gaps table to support AI-evaluated improvement opportunities
-- This refactors gaps from simple "competitor mentioned, brand not" to intelligent analysis

-- Add new columns for AI evaluation
ALTER TABLE visibility_gaps
  ADD COLUMN IF NOT EXISTS issue_type TEXT,
  ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS ai_analysis TEXT,
  ADD COLUMN IF NOT EXISTS improvement_suggestion TEXT,
  ADD COLUMN IF NOT EXISTS suggested_action TEXT,
  ADD COLUMN IF NOT EXISTS response_excerpt TEXT,
  ADD COLUMN IF NOT EXISTS brand_sentiment TEXT,
  ADD COLUMN IF NOT EXISTS competitor_sentiment TEXT;

-- Update gap_type to support new types
COMMENT ON COLUMN visibility_gaps.gap_type IS 'Gap types: competitor_only (not mentioned), negative_comparison (unfavorable comparison), missing_feature (competitor feature highlighted), pricing_concern (price disadvantage mentioned), outdated_info (stale brand info), positioning_issue (poor positioning)';

COMMENT ON COLUMN visibility_gaps.issue_type IS 'Specific issue: price_comparison, feature_gap, market_position, recommendation_bias, missing_mention, negative_sentiment';

COMMENT ON COLUMN visibility_gaps.severity IS 'Impact severity: low, medium, high, critical';

COMMENT ON COLUMN visibility_gaps.ai_analysis IS 'AI explanation of what the issue is and why it matters';

COMMENT ON COLUMN visibility_gaps.improvement_suggestion IS 'Specific content improvement suggestion from AI';

COMMENT ON COLUMN visibility_gaps.suggested_action IS 'Actionable next step: create_comparison_post, update_pricing_page, add_feature_docs, create_case_study, etc.';

COMMENT ON COLUMN visibility_gaps.response_excerpt IS 'Relevant excerpt from AI response showing the issue';

-- Add index for filtering by severity
CREATE INDEX IF NOT EXISTS idx_visibility_gaps_severity ON visibility_gaps(severity) WHERE resolved_at IS NULL;

-- Add index for filtering by issue_type
CREATE INDEX IF NOT EXISTS idx_visibility_gaps_issue_type ON visibility_gaps(issue_type) WHERE resolved_at IS NULL;

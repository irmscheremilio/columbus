-- Add ai_generated column to fix_recommendations
ALTER TABLE fix_recommendations
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;

-- Add visibility_history table for tracking visibility over time per AI model
CREATE TABLE IF NOT EXISTS visibility_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ai_model TEXT NOT NULL, -- chatgpt, claude, gemini, perplexity
  score INTEGER CHECK (score >= 0 AND score <= 100),
  mention_rate DECIMAL(5,2), -- percentage 0-100
  citation_rate DECIMAL(5,2), -- percentage 0-100
  prompts_tested INTEGER DEFAULT 0,
  prompts_mentioned INTEGER DEFAULT 0,
  prompts_cited INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_visibility_history_org_model
ON visibility_history(organization_id, ai_model);

CREATE INDEX IF NOT EXISTS idx_visibility_history_recorded_at
ON visibility_history(recorded_at);

-- RLS for visibility_history
ALTER TABLE visibility_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's visibility history"
  ON visibility_history FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Service role can insert visibility history"
  ON visibility_history FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE visibility_history IS 'Stores historical visibility scores per AI model for trend analysis';

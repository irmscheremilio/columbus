-- Competitor Results Table
-- Stores results from testing prompts that include competitor mentions
CREATE TABLE IF NOT EXISTS competitor_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE NOT NULL,
  ai_model TEXT NOT NULL,
  competitor_mentioned BOOLEAN DEFAULT FALSE,
  brand_mentioned BOOLEAN DEFAULT FALSE,
  response_text TEXT,
  tested_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visibility Gaps Table
-- Tracks specific instances where competitors appear but brand doesn't
CREATE TABLE IF NOT EXISTS visibility_gaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE NOT NULL,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE NOT NULL,
  ai_model TEXT NOT NULL,
  competitor_mentioned BOOLEAN DEFAULT TRUE,
  brand_mentioned BOOLEAN DEFAULT FALSE,
  gap_type TEXT DEFAULT 'competitor_only', -- 'competitor_only', 'better_position', 'better_sentiment'
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_competitor_results_org ON competitor_results(organization_id);
CREATE INDEX idx_competitor_results_competitor ON competitor_results(competitor_id);
CREATE INDEX idx_competitor_results_tested_at ON competitor_results(tested_at);

CREATE INDEX idx_visibility_gaps_org ON visibility_gaps(organization_id);
CREATE INDEX idx_visibility_gaps_competitor ON visibility_gaps(competitor_id);
CREATE INDEX idx_visibility_gaps_unresolved ON visibility_gaps(resolved_at) WHERE resolved_at IS NULL;

-- RLS Policies
ALTER TABLE competitor_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE visibility_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's competitor results"
  ON competitor_results FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view their organization's visibility gaps"
  ON visibility_gaps FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

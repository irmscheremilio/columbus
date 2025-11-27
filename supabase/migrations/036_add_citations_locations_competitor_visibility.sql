-- Migration: Add citations, locations, competitor visibility, and improvement suggestions
-- This migration adds support for:
-- 1. Source/citation tracking (URLs cited by AI)
-- 2. Location-based prompts (geo-targeting)
-- 3. Competitor visibility scoring
-- 4. AI improvement suggestions

-- ============================================
-- 1. CITATIONS TABLE - Track sources cited by AI
-- ============================================
CREATE TABLE IF NOT EXISTS prompt_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_result_id UUID NOT NULL REFERENCES prompt_results(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  source_title TEXT,
  citation_text TEXT, -- The text/context around the citation
  citation_position INTEGER, -- Order in which it appeared (1st, 2nd, etc.)
  is_brand_source BOOLEAN DEFAULT false, -- Is this the user's own domain?
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying citations by domain
CREATE INDEX idx_prompt_citations_domain ON prompt_citations(source_domain);
CREATE INDEX idx_prompt_citations_org ON prompt_citations(organization_id);
CREATE INDEX idx_prompt_citations_product ON prompt_citations(product_id);
CREATE INDEX idx_prompt_citations_result ON prompt_citations(prompt_result_id);

-- ============================================
-- 2. LOCATION FIELDS FOR PROMPTS
-- ============================================
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS target_location TEXT;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS target_country TEXT;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS target_region TEXT;
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS target_language TEXT DEFAULT 'en';

-- Also track location in results for analysis
ALTER TABLE prompt_results ADD COLUMN IF NOT EXISTS request_location TEXT;
ALTER TABLE prompt_results ADD COLUMN IF NOT EXISTS request_country TEXT;

-- Add primary target location to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_location TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_country TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_language TEXT DEFAULT 'en';

-- ============================================
-- 3. COMPETITOR VISIBILITY SCORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS competitor_visibility_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  ai_model TEXT NOT NULL, -- chatgpt, claude, gemini, perplexity, or 'overall'
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  mention_rate DECIMAL(5,2), -- Percentage of prompts mentioning this competitor
  avg_position DECIMAL(3,1), -- Average position when mentioned
  prompts_tested INTEGER DEFAULT 0,
  prompts_mentioned INTEGER DEFAULT 0,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_competitor_visibility_org ON competitor_visibility_scores(organization_id);
CREATE INDEX idx_competitor_visibility_product ON competitor_visibility_scores(product_id);
CREATE INDEX idx_competitor_visibility_competitor ON competitor_visibility_scores(competitor_id);

-- Unique constraint for upsert
CREATE UNIQUE INDEX idx_competitor_visibility_unique ON competitor_visibility_scores(competitor_id, ai_model);

-- ============================================
-- 4. COMPETITOR VISIBILITY HISTORY (for trends)
-- ============================================
CREATE TABLE IF NOT EXISTS competitor_visibility_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  ai_model TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  mention_rate DECIMAL(5,2),
  avg_position DECIMAL(3,1),
  prompts_tested INTEGER DEFAULT 0,
  prompts_mentioned INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_competitor_history_recorded ON competitor_visibility_history(recorded_at);
CREATE INDEX idx_competitor_history_competitor ON competitor_visibility_history(competitor_id);

-- ============================================
-- 5. IMPROVEMENT SUGGESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS improvement_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  prompt_result_id UUID REFERENCES prompt_results(id) ON DELETE CASCADE,
  ai_model TEXT NOT NULL,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN (
    'negative_comparison',      -- AI mentioned a negative comparison
    'missing_feature',          -- AI said product lacks something
    'competitor_advantage',     -- Competitor was highlighted positively
    'pricing_concern',          -- Price mentioned as issue
    'outdated_info',           -- AI has stale/incorrect info
    'missing_mention',         -- Brand not mentioned at all
    'low_position',            -- Brand mentioned late
    'no_citation'              -- Brand not cited/sourced
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  context TEXT, -- The relevant quote from AI response
  recommended_action TEXT, -- What user should do
  competitor_id UUID REFERENCES competitors(id), -- If related to a competitor
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_improvement_suggestions_org ON improvement_suggestions(organization_id);
CREATE INDEX idx_improvement_suggestions_product ON improvement_suggestions(product_id);
CREATE INDEX idx_improvement_suggestions_type ON improvement_suggestions(suggestion_type);
CREATE INDEX idx_improvement_suggestions_severity ON improvement_suggestions(severity);
CREATE INDEX idx_improvement_suggestions_unresolved ON improvement_suggestions(is_resolved) WHERE is_resolved = false;

-- ============================================
-- 6. UPDATE COMPETITOR MENTIONS FOR POSITION
-- ============================================
ALTER TABLE competitor_mentions ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;

-- ============================================
-- 7. SOURCE AGGREGATION VIEW
-- ============================================
CREATE OR REPLACE VIEW source_domain_stats AS
SELECT
  organization_id,
  product_id,
  source_domain,
  COUNT(*) as citation_count,
  COUNT(DISTINCT prompt_result_id) as unique_results,
  SUM(CASE WHEN is_brand_source THEN 1 ELSE 0 END) as brand_source_count,
  MIN(created_at) as first_seen,
  MAX(created_at) as last_seen
FROM prompt_citations
GROUP BY organization_id, product_id, source_domain;

-- ============================================
-- 8. RLS POLICIES
-- ============================================

-- Citations RLS
ALTER TABLE prompt_citations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's citations"
  ON prompt_citations FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Service role can manage citations"
  ON prompt_citations FOR ALL
  USING (true)
  WITH CHECK (true);

-- Competitor visibility scores RLS
ALTER TABLE competitor_visibility_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's competitor scores"
  ON competitor_visibility_scores FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Service role can manage competitor scores"
  ON competitor_visibility_scores FOR ALL
  USING (true)
  WITH CHECK (true);

-- Competitor visibility history RLS
ALTER TABLE competitor_visibility_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's competitor history"
  ON competitor_visibility_history FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Service role can manage competitor history"
  ON competitor_visibility_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- Improvement suggestions RLS
ALTER TABLE improvement_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's suggestions"
  ON improvement_suggestions FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their organization's suggestions"
  ON improvement_suggestions FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Service role can manage suggestions"
  ON improvement_suggestions FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 9. GRANT PERMISSIONS
-- ============================================
GRANT SELECT ON source_domain_stats TO authenticated;
GRANT ALL ON prompt_citations TO service_role;
GRANT ALL ON competitor_visibility_scores TO service_role;
GRANT ALL ON competitor_visibility_history TO service_role;
GRANT ALL ON improvement_suggestions TO service_role;

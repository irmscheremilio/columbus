-- Website Analyses Table
-- Stores results of website crawling and AEO readiness analysis

CREATE TABLE IF NOT EXISTS website_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  domain TEXT NOT NULL,
  tech_stack JSONB NOT NULL,
  schema_markup JSONB NOT NULL DEFAULT '[]'::jsonb,
  content_structure JSONB NOT NULL,
  technical_seo JSONB NOT NULL,
  aeo_readiness JSONB NOT NULL,
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_website_analyses_org ON website_analyses(organization_id);
CREATE INDEX idx_website_analyses_domain ON website_analyses(domain);
CREATE INDEX idx_website_analyses_analyzed_at ON website_analyses(analyzed_at DESC);

-- RLS Policies
ALTER TABLE website_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's website analyses"
  ON website_analyses FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their organization's website analyses"
  ON website_analyses FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's website analyses"
  ON website_analyses FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their organization's website analyses"
  ON website_analyses FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Add started_at column to fix_recommendations for tracking implementation progress
ALTER TABLE fix_recommendations
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fix_recommendations_status ON fix_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_fix_recommendations_priority ON fix_recommendations(priority DESC);
CREATE INDEX IF NOT EXISTS idx_fix_recommendations_category ON fix_recommendations(category);

-- Add page_url column to fix_recommendations to track which page a recommendation applies to
-- Also add a table to track crawled pages

ALTER TABLE fix_recommendations
ADD COLUMN IF NOT EXISTS page_url TEXT,
ADD COLUMN IF NOT EXISTS page_title TEXT;

-- Create index for filtering recommendations by page
CREATE INDEX IF NOT EXISTS idx_fix_recommendations_page_url ON fix_recommendations(organization_id, page_url);

-- Table to track discovered/crawled pages for each organization
CREATE TABLE IF NOT EXISTS crawled_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  path TEXT NOT NULL,
  title TEXT,
  is_relevant BOOLEAN DEFAULT true,
  relevance_reason TEXT,
  content_type TEXT, -- 'blog', 'faq', 'product', 'landing', 'about', 'pricing', 'docs', 'other'
  last_crawled_at TIMESTAMPTZ,
  aeo_score INTEGER, -- 0-100
  word_count INTEGER,
  has_schema BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, url)
);

-- RLS for crawled_pages
ALTER TABLE crawled_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organization crawled pages"
  ON crawled_pages FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert crawled pages for own organization"
  ON crawled_pages FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update own organization crawled pages"
  ON crawled_pages FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Migration: Add competitor citation tracking
-- This allows tracking which citations are from competitor domains
-- By using domain matching, we can show historical data even for newly tracked competitors

-- Add field to mark if a citation is from a competitor (AI-evaluated)
ALTER TABLE prompt_citations ADD COLUMN IF NOT EXISTS is_competitor_source BOOLEAN DEFAULT false;

-- Index for efficient competitor citation queries
CREATE INDEX IF NOT EXISTS idx_prompt_citations_competitor_source
  ON prompt_citations(source_domain, is_competitor_source)
  WHERE is_competitor_source = true;

-- Create a view for competitor citation stats by domain
-- This allows querying citation rates for any domain, whether tracked or not
CREATE OR REPLACE VIEW competitor_citation_stats AS
SELECT
  pc.organization_id,
  pc.product_id,
  pc.source_domain,
  COUNT(*) as citation_count,
  COUNT(DISTINCT pc.prompt_result_id) as unique_results,
  MIN(pc.created_at) as first_cited,
  MAX(pc.created_at) as last_cited
FROM prompt_citations pc
WHERE pc.is_competitor_source = true
GROUP BY pc.organization_id, pc.product_id, pc.source_domain;

-- Grant access to the view
GRANT SELECT ON competitor_citation_stats TO authenticated;

-- Add comment for documentation
COMMENT ON COLUMN prompt_citations.is_competitor_source IS 'AI-evaluated: true if this citation is from a competitor domain in the same industry/space';

-- Migration: Add indexes for efficient competitor metrics queries
-- These queries filter by product_id and date range

-- Index for competitor_mentions queries by product and date
CREATE INDEX IF NOT EXISTS idx_competitor_mentions_product_date
  ON competitor_mentions(product_id, detected_at DESC);

-- Index for prompt_citations queries by product and date
CREATE INDEX IF NOT EXISTS idx_prompt_citations_product_date
  ON prompt_citations(product_id, created_at DESC);

-- Composite index for competitor_mentions with competitor_id for filtering
CREATE INDEX IF NOT EXISTS idx_competitor_mentions_product_competitor
  ON competitor_mentions(product_id, competitor_id, detected_at DESC);

-- Migration: Add brand domain aliases for citation matching
-- Allows products to have multiple domains that count as "brand citations"
-- Example: domeba.com might also want imansys.com citations to count as brand citations

-- Add domain_aliases column (array of additional domains)
ALTER TABLE products ADD COLUMN IF NOT EXISTS domain_aliases TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN products.domain_aliases IS 'Additional domains that should be counted as brand citations. Example: if brand is domeba.com but they also own imansys.com, add imansys.com here.';

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_products_domain_aliases ON products USING GIN (domain_aliases);

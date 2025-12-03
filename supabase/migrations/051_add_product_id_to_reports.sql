-- Add product_id column to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;

-- Create index for product lookups
CREATE INDEX IF NOT EXISTS idx_reports_product ON reports(product_id);

-- Update existing reports to link to the first product of the organization
UPDATE reports r
SET product_id = (
  SELECT p.id FROM products p
  WHERE p.organization_id = r.organization_id
  AND p.is_active = true
  ORDER BY p.created_at ASC
  LIMIT 1
)
WHERE r.product_id IS NULL;

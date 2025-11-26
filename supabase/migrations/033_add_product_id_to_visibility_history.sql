-- Migration: Add product_id to visibility_history table
-- This table was missed in the 031_products_architecture migration

-- Add product_id column
ALTER TABLE visibility_history
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;

-- Create index for product_id queries
CREATE INDEX IF NOT EXISTS idx_visibility_history_product
ON visibility_history(product_id);

-- Update RLS policy to include product-based access
DROP POLICY IF EXISTS "Users can view their organization's visibility history" ON visibility_history;

CREATE POLICY "Users can view their product's visibility history"
  ON visibility_history FOR SELECT
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN profiles pr ON p.organization_id = pr.organization_id
      WHERE pr.id = auth.uid()
    )
    OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Migrate existing data to use product_id where possible
-- This updates visibility_history records to link to the first active product of their organization
UPDATE visibility_history vh
SET product_id = (
  SELECT p.id FROM products p
  WHERE p.organization_id = vh.organization_id
    AND p.is_active = true
  ORDER BY p.created_at ASC
  LIMIT 1
)
WHERE vh.product_id IS NULL
  AND vh.organization_id IS NOT NULL;

-- Products Architecture Migration
-- Changes: Rename brands to products, add product_id to data tables,
-- implement plan-based product limits, remove domain from organizations

-- 1. Rename brands table to products
ALTER TABLE brands RENAME TO products;

-- 2. Add new columns to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS domain TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS aeo_score INTEGER,
ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMPTZ;

-- 3. Populate domain from website URL
UPDATE products
SET domain = regexp_replace(website, '^https?://([^/]+).*$', '\1')
WHERE website IS NOT NULL AND domain IS NULL;

-- 4. Add product_id foreign key to data tables
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE prompt_results ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE visibility_scores ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE fix_recommendations ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE website_analyses ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE crawled_pages ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;

-- Also add to product_analyses if exists
ALTER TABLE product_analyses ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;

-- 5. Migrate existing data: link records to first active product of each org
UPDATE prompts p SET product_id = (
  SELECT id FROM products WHERE organization_id = p.organization_id AND is_active = true ORDER BY created_at LIMIT 1
) WHERE product_id IS NULL;

UPDATE prompt_results pr SET product_id = (
  SELECT id FROM products WHERE organization_id = pr.organization_id AND is_active = true ORDER BY created_at LIMIT 1
) WHERE product_id IS NULL;

UPDATE visibility_scores vs SET product_id = (
  SELECT id FROM products WHERE organization_id = vs.organization_id AND is_active = true ORDER BY created_at LIMIT 1
) WHERE product_id IS NULL;

UPDATE fix_recommendations fr SET product_id = (
  SELECT id FROM products WHERE organization_id = fr.organization_id AND is_active = true ORDER BY created_at LIMIT 1
) WHERE product_id IS NULL;

UPDATE website_analyses wa SET product_id = (
  SELECT id FROM products WHERE organization_id = wa.organization_id AND is_active = true ORDER BY created_at LIMIT 1
) WHERE product_id IS NULL;

UPDATE crawled_pages cp SET product_id = (
  SELECT id FROM products WHERE organization_id = cp.organization_id AND is_active = true ORDER BY created_at LIMIT 1
) WHERE product_id IS NULL;

UPDATE competitors c SET product_id = (
  SELECT id FROM products WHERE organization_id = c.organization_id AND is_active = true ORDER BY created_at LIMIT 1
) WHERE product_id IS NULL;

UPDATE jobs j SET product_id = (
  SELECT id FROM products WHERE organization_id = j.organization_id AND is_active = true ORDER BY created_at LIMIT 1
) WHERE product_id IS NULL;

UPDATE product_analyses pa SET product_id = (
  SELECT id FROM products WHERE organization_id = pa.organization_id AND is_active = true ORDER BY created_at LIMIT 1
) WHERE product_id IS NULL;

-- 6. Add product limit column to organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS product_limit INTEGER DEFAULT 1;

-- 7. Update product limits based on current plan
UPDATE organizations SET product_limit =
  CASE
    WHEN plan IN ('free', 'pro') THEN 1
    WHEN plan = 'agency' THEN 5
    WHEN plan = 'enterprise' THEN 100
    ELSE 1
  END;

-- 8. Add active_product_id to profiles for tracking current product context
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS active_product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- Set active_product_id to first product for existing users
UPDATE profiles p SET active_product_id = (
  SELECT id FROM products WHERE organization_id = p.organization_id AND is_active = true ORDER BY created_at LIMIT 1
) WHERE active_product_id IS NULL AND organization_id IS NOT NULL;

-- 9. Create function to check if org can create more products
CREATE OR REPLACE FUNCTION can_create_product(p_org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  SELECT COUNT(*) INTO current_count
  FROM products
  WHERE organization_id = p_org_id AND is_active = true;

  SELECT product_limit INTO max_limit
  FROM organizations
  WHERE id = p_org_id;

  RETURN current_count < COALESCE(max_limit, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to get remaining product slots
CREATE OR REPLACE FUNCTION get_product_slots(p_org_id UUID)
RETURNS TABLE (current_count INTEGER, max_limit INTEGER, remaining INTEGER) AS $$
DECLARE
  v_current INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_current
  FROM products
  WHERE organization_id = p_org_id AND is_active = true;

  SELECT COALESCE(product_limit, 1)::INTEGER INTO v_limit
  FROM organizations
  WHERE id = p_org_id;

  RETURN QUERY SELECT v_current, v_limit, (v_limit - v_current)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create indexes for product_id columns
CREATE INDEX IF NOT EXISTS idx_prompts_product ON prompts(product_id);
CREATE INDEX IF NOT EXISTS idx_prompt_results_product ON prompt_results(product_id);
CREATE INDEX IF NOT EXISTS idx_visibility_scores_product ON visibility_scores(product_id);
CREATE INDEX IF NOT EXISTS idx_fix_recommendations_product ON fix_recommendations(product_id);
CREATE INDEX IF NOT EXISTS idx_website_analyses_product ON website_analyses(product_id);
CREATE INDEX IF NOT EXISTS idx_crawled_pages_product ON crawled_pages(product_id);
CREATE INDEX IF NOT EXISTS idx_competitors_product ON competitors(product_id);
CREATE INDEX IF NOT EXISTS idx_jobs_product ON jobs(product_id);
CREATE INDEX IF NOT EXISTS idx_products_org_active ON products(organization_id, is_active);

-- 12. Update RLS policies for products table (renamed from brands)
DROP POLICY IF EXISTS "Users can create brands" ON products;
DROP POLICY IF EXISTS "Users can view brands" ON products;
DROP POLICY IF EXISTS "Users can update brands" ON products;

CREATE POLICY "Users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    OR organization_id IN (
      SELECT active_organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND can_create_product(organization_id)
  );

CREATE POLICY "Users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND organization_id = products.organization_id
      AND role IN ('owner', 'admin')
    )
  );

-- 13. Service role full access for products
CREATE POLICY "Service role products access"
  ON products FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 14. Remove domain column from organizations (data now lives in products)
-- Note: Keeping this commented for safety - uncomment after verifying data migration
-- ALTER TABLE organizations DROP COLUMN IF EXISTS domain;

-- 15. Trigger to auto-update product_limit when plan changes
CREATE OR REPLACE FUNCTION update_product_limit_on_plan_change()
RETURNS TRIGGER AS $$
BEGIN
  NEW.product_limit = CASE
    WHEN NEW.plan IN ('free', 'pro') THEN 1
    WHEN NEW.plan = 'agency' THEN 5
    WHEN NEW.plan = 'enterprise' THEN 100
    ELSE 1
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_limit ON organizations;
CREATE TRIGGER trigger_update_product_limit
  BEFORE UPDATE OF plan ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_product_limit_on_plan_change();

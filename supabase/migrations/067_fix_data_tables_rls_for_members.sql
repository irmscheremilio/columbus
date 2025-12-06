-- Fix RLS policies for data tables to support organization members
-- The issue: RLS policies only check profiles.organization_id, but members
-- are tracked in organization_members table

-- Simple helper function: check if user is a member of the organization
CREATE OR REPLACE FUNCTION user_is_org_member(p_org_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Fix prompt_results RLS
DROP POLICY IF EXISTS "Users can view their organization's prompt results" ON prompt_results;
CREATE POLICY "Users can view their organization's prompt results"
  ON prompt_results FOR SELECT
  USING (user_is_org_member(organization_id));

DROP POLICY IF EXISTS "Users can insert prompt results" ON prompt_results;
CREATE POLICY "Users can insert prompt results"
  ON prompt_results FOR INSERT
  WITH CHECK (user_is_org_member(organization_id));

DROP POLICY IF EXISTS "Users can update prompt results" ON prompt_results;
CREATE POLICY "Users can update prompt results"
  ON prompt_results FOR UPDATE
  USING (user_is_org_member(organization_id));

DROP POLICY IF EXISTS "Users can delete prompt results" ON prompt_results;
CREATE POLICY "Users can delete prompt results"
  ON prompt_results FOR DELETE
  USING (user_is_org_member(organization_id));

-- Fix visibility_scores RLS
DROP POLICY IF EXISTS "Users can view their organization's visibility scores" ON visibility_scores;
CREATE POLICY "Users can view their organization's visibility scores"
  ON visibility_scores FOR SELECT
  USING (user_is_org_member(organization_id));

DROP POLICY IF EXISTS "Users can insert visibility scores" ON visibility_scores;
CREATE POLICY "Users can insert visibility scores"
  ON visibility_scores FOR INSERT
  WITH CHECK (user_is_org_member(organization_id));

DROP POLICY IF EXISTS "Users can update visibility scores" ON visibility_scores;
CREATE POLICY "Users can update visibility scores"
  ON visibility_scores FOR UPDATE
  USING (user_is_org_member(organization_id));

-- Fix fix_recommendations RLS
DROP POLICY IF EXISTS "Users can manage their organization's recommendations" ON fix_recommendations;
CREATE POLICY "Users can manage their organization's recommendations"
  ON fix_recommendations FOR ALL
  USING (user_is_org_member(organization_id));

-- Fix competitors RLS
DROP POLICY IF EXISTS "Users can manage their organization's competitors" ON competitors;
CREATE POLICY "Users can manage their organization's competitors"
  ON competitors FOR ALL
  USING (user_is_org_member(organization_id));

-- Fix jobs RLS
DROP POLICY IF EXISTS "Users can view their organization's jobs" ON jobs;
DROP POLICY IF EXISTS "Users can insert jobs" ON jobs;

CREATE POLICY "Users can view their organization's jobs"
  ON jobs FOR SELECT
  USING (user_is_org_member(organization_id));

CREATE POLICY "Users can insert jobs"
  ON jobs FOR INSERT
  WITH CHECK (user_is_org_member(organization_id));

-- Fix api_usage RLS
DROP POLICY IF EXISTS "Users can view their organization's API usage" ON api_usage;
CREATE POLICY "Users can view their organization's API usage"
  ON api_usage FOR SELECT
  USING (user_is_org_member(organization_id));

-- Fix prompts RLS
DROP POLICY IF EXISTS "Users can manage their organization's prompts" ON prompts;
CREATE POLICY "Users can manage their organization's prompts"
  ON prompts FOR ALL
  USING (user_is_org_member(organization_id));

-- Fix subscriptions RLS
DROP POLICY IF EXISTS "Users can view their organization's subscription" ON subscriptions;
CREATE POLICY "Users can view their organization's subscription"
  ON subscriptions FOR SELECT
  USING (user_is_org_member(organization_id));

-- Fix products RLS
DROP POLICY IF EXISTS "Users can view products" ON products;
DROP POLICY IF EXISTS "Users can create products" ON products;
DROP POLICY IF EXISTS "Users can update products" ON products;
DROP POLICY IF EXISTS "Users can delete products" ON products;

CREATE POLICY "Users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (user_is_org_member(organization_id));

CREATE POLICY "Users can create products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    user_is_org_member(organization_id)
    AND can_create_product(organization_id)
  );

CREATE POLICY "Users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (user_is_org_member(organization_id));

CREATE POLICY "Users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (
    user_is_org_member(organization_id)
    AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = products.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Fix website_analyses RLS (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'website_analyses') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage website analyses" ON website_analyses';
    EXECUTE 'CREATE POLICY "Users can manage website analyses" ON website_analyses FOR ALL USING (user_is_org_member(organization_id))';
  END IF;
END $$;

-- Fix crawled_pages RLS (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crawled_pages') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage crawled pages" ON crawled_pages';
    EXECUTE 'CREATE POLICY "Users can manage crawled pages" ON crawled_pages FOR ALL USING (user_is_org_member(organization_id))';
  END IF;
END $$;

-- Fix product_analyses RLS (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_analyses') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage product analyses" ON product_analyses';
    EXECUTE 'CREATE POLICY "Users can manage product analyses" ON product_analyses FOR ALL USING (user_is_org_member(organization_id))';
  END IF;
END $$;

-- Fix visibility_history RLS (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'visibility_history') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view visibility history" ON visibility_history';
    EXECUTE 'CREATE POLICY "Users can view visibility history" ON visibility_history FOR SELECT USING (user_is_org_member(organization_id))';
  END IF;
END $$;

-- Fix citations RLS (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'citations') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view citations" ON citations';
    EXECUTE 'CREATE POLICY "Users can view citations" ON citations FOR SELECT USING (user_is_org_member(organization_id))';
  END IF;
END $$;

-- Fix reports RLS (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reports') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage reports" ON reports';
    EXECUTE 'CREATE POLICY "Users can manage reports" ON reports FOR ALL USING (user_is_org_member(organization_id))';
  END IF;
END $$;

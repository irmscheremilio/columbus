-- Migration: Fix prompts RLS policies to support product_id-based access
-- The existing policies only check organization_id, but inserts now use product_id

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can create prompts" ON prompts;

-- Drop the old "ALL" policy and recreate separate policies for better control
DROP POLICY IF EXISTS "Users can manage their organization's prompts" ON prompts;

-- SELECT: Users can view prompts for products they have access to
CREATE POLICY "Users can view prompts"
  ON prompts FOR SELECT
  TO authenticated
  USING (
    -- Via organization_id (legacy)
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT active_organization_id FROM profiles WHERE id = auth.uid()
    )
    OR
    -- Via product_id (new)
    product_id IN (
      SELECT p.id FROM products p
      WHERE p.organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT active_organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- INSERT: Users can create prompts for products they have access to
CREATE POLICY "Users can create prompts"
  ON prompts FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Via product_id
    product_id IN (
      SELECT p.id FROM products p
      WHERE p.organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT active_organization_id FROM profiles WHERE id = auth.uid()
      )
    )
    OR
    -- Via organization_id (legacy fallback)
    (
      product_id IS NULL
      AND organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- UPDATE: Users can update prompts for products they have access to
CREATE POLICY "Users can update prompts"
  ON prompts FOR UPDATE
  TO authenticated
  USING (
    -- Via organization_id (legacy)
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT active_organization_id FROM profiles WHERE id = auth.uid()
    )
    OR
    -- Via product_id (new)
    product_id IN (
      SELECT p.id FROM products p
      WHERE p.organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT active_organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- DELETE: Users can delete prompts for products they have access to
CREATE POLICY "Users can delete prompts"
  ON prompts FOR DELETE
  TO authenticated
  USING (
    -- Via organization_id (legacy)
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT active_organization_id FROM profiles WHERE id = auth.uid()
    )
    OR
    -- Via product_id (new)
    product_id IN (
      SELECT p.id FROM products p
      WHERE p.organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
        UNION
        SELECT active_organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Service role full access
DROP POLICY IF EXISTS "Service role prompts access" ON prompts;
CREATE POLICY "Service role prompts access"
  ON prompts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger to auto-populate organization_id from product_id on insert
CREATE OR REPLACE FUNCTION set_prompt_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If product_id is provided but organization_id is not, derive it from the product
  IF NEW.product_id IS NOT NULL AND NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM products
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_prompt_organization_id ON prompts;
CREATE TRIGGER trigger_set_prompt_organization_id
  BEFORE INSERT ON prompts
  FOR EACH ROW
  EXECUTE FUNCTION set_prompt_organization_id();

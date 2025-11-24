-- Fix the chicken and egg problem with brands policies
-- Allow users to create and view brands during signup flow

DROP POLICY IF EXISTS "Users can create brands" ON brands;
DROP POLICY IF EXISTS "Users can view brands" ON brands;

-- Users can insert brands for their organization OR during signup
CREATE POLICY "Users can create brands"
  ON brands FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User's profile has organization_id matching the brand's organization
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
    OR
    -- User's profile doesn't have an organization yet (signup flow)
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND organization_id IS NOT NULL
    )
  );

-- Users can view brands in their organization OR recently created brands during signup
CREATE POLICY "Users can view brands"
  ON brands FOR SELECT
  TO authenticated
  USING (
    -- User is a member of the organization
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
    OR
    -- Brand was recently created and user doesn't have an org yet (signup flow)
    (
      created_at > NOW() - INTERVAL '5 minutes'
      AND NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND organization_id IS NOT NULL
      )
    )
  );

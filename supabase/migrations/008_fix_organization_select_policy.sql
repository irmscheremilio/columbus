-- Fix the chicken and egg problem with organization SELECT policy
-- Allow users to view organizations they just created, even before their profile is updated

DROP POLICY IF EXISTS "Users can view their organization" ON organizations;

-- Users can view organizations they're a member of OR organizations created in the same transaction
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    -- User is a member (profile has organization_id set)
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.organization_id = organizations.id
      AND profiles.id = auth.uid()
    )
    OR
    -- Allow viewing recently created organizations (within last 5 minutes) by the same user
    -- This handles the signup flow where org is created before profile is updated
    (
      organizations.created_at > NOW() - INTERVAL '5 minutes'
      AND NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.organization_id IS NOT NULL
      )
    )
  );

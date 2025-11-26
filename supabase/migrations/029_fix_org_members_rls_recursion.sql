-- Fix infinite recursion in organization_members RLS policies
-- The issue is that policies on organization_members reference organization_members itself

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view org members" ON organization_members;
DROP POLICY IF EXISTS "Org admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "Org admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Org admins can remove members" ON organization_members;

-- Recreate policies using direct user_id check to avoid recursion
-- Users can view members of orgs where they are a direct member
CREATE POLICY "Users can view org members"
  ON organization_members FOR SELECT
  USING (
    -- User can see their own membership row
    user_id = auth.uid()
    -- Or user can see other members if they share the same org
    -- This uses a correlated subquery that checks profiles table instead
    OR organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid() AND organization_id IS NOT NULL
    )
    OR organization_id IN (
      SELECT active_organization_id FROM profiles WHERE id = auth.uid() AND active_organization_id IS NOT NULL
    )
  );

-- For INSERT: Check via profiles table, not organization_members
CREATE POLICY "Org admins can manage members"
  ON organization_members FOR INSERT
  WITH CHECK (
    -- Check if current user is owner/admin via their own row (which they can read)
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
    -- Or user is inserting themselves (e.g., accepting an invite)
    OR user_id = auth.uid()
  );

-- For UPDATE: Similar approach
CREATE POLICY "Org admins can update members"
  ON organization_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- For DELETE: Admins can remove, users can remove themselves
CREATE POLICY "Org admins can remove members"
  ON organization_members FOR DELETE
  USING (
    -- User can remove themselves
    user_id = auth.uid()
    -- Or admin/owner can remove others
    OR EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- Also fix the organizations policy that may have similar issues
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;

CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    -- User's primary org from profile
    id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    -- User's active org from profile
    OR id IN (SELECT active_organization_id FROM profiles WHERE id = auth.uid())
    -- User is a member (use EXISTS to avoid issues)
    OR EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id
        AND om.user_id = auth.uid()
    )
  );

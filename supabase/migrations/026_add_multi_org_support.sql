-- Support for users being members of multiple organizations
-- and tracking their active/current organization

-- Add active_organization_id to profiles for tracking current org context
ALTER TABLE profiles
ADD COLUMN active_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Update existing profiles to set active_organization_id = organization_id
UPDATE profiles
SET active_organization_id = organization_id
WHERE organization_id IS NOT NULL;

-- Create organization_members junction table for multi-org membership
-- This allows a user to belong to multiple organizations
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Indexes
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

-- Enable RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_members

-- Users can view members of organizations they belong to
CREATE POLICY "Users can view org members"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Org admins and owners can manage members
CREATE POLICY "Org admins can manage members"
  ON organization_members FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can update members"
  ON organization_members FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org admins can remove members"
  ON organization_members FOR DELETE
  USING (
    -- Admins can remove others, users can remove themselves
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    OR user_id = auth.uid()
  );

-- Service role full access
CREATE POLICY "Service role org members access"
  ON organization_members FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Migrate existing profile organization relationships to organization_members
INSERT INTO organization_members (organization_id, user_id, role)
SELECT organization_id, id, role
FROM profiles
WHERE organization_id IS NOT NULL
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Update RLS policies on organizations to use organization_members
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;

CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    OR id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- Update profiles policy to allow updating active_organization_id
DROP POLICY IF EXISTS "Users can update their own record" ON profiles;

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Allow inserting own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Function to switch active organization
CREATE OR REPLACE FUNCTION switch_organization(
  p_organization_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_member BOOLEAN;
BEGIN
  -- Check if user is a member of the organization
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_organization_id
    AND user_id = auth.uid()
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RETURN FALSE;
  END IF;

  -- Update active organization
  UPDATE profiles
  SET active_organization_id = p_organization_id
  WHERE id = auth.uid();

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's organizations
CREATE OR REPLACE FUNCTION get_user_organizations()
RETURNS TABLE (
  organization_id UUID,
  organization_name TEXT,
  user_role TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    om.organization_id,
    o.name,
    om.role,
    (p.active_organization_id = om.organization_id) as is_active
  FROM organization_members om
  JOIN organizations o ON o.id = om.organization_id
  JOIN profiles p ON p.id = auth.uid()
  WHERE om.user_id = auth.uid()
  ORDER BY o.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

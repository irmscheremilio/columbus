-- Drop ALL existing policies on organizations
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Admins can update organization" ON organizations;
DROP POLICY IF EXISTS "Organizations: admins can manage" ON organizations;

-- Simple policy: any authenticated user can create an organization
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can view organizations they're a member of
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.organization_id = organizations.id
      AND profiles.id = auth.uid()
    )
  );

-- Users can update their organization
CREATE POLICY "Users can update their organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.organization_id = organizations.id
      AND profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin')
    )
  );

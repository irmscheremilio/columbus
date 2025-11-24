-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Organizations: admins can manage" ON organizations;
DROP POLICY IF EXISTS "Users can view their own record" ON profiles;

-- Organizations: Allow authenticated users to insert their first organization
CREATE POLICY "Users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Organizations: Users can view organizations they belong to
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Organizations: Owners and admins can update their organization
CREATE POLICY "Admins can update organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Users: Allow authenticated users to insert their own record
CREATE POLICY "Users can insert their own record"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Users: Users can view their own record
CREATE POLICY "Users can view their own record"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users: Users can update their own record
CREATE POLICY "Users can update their own record"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Prompts: Users can insert prompts for their organization
CREATE POLICY "Users can create prompts"
  ON prompts FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
    OR
    -- Allow if user is creating organization (no record yet)
    NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
  );

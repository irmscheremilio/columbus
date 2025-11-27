-- Auto-create organization when a new user signs up
-- This ensures users always have an organization, regardless of how they sign up
-- (frontend, extension, API, etc.)

-- Update the handle_new_user function to also create an organization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
  org_name TEXT;
BEGIN
  -- Extract name from email for organization name
  org_name := COALESCE(
    split_part(NEW.email, '@', 1),
    'User'
  ) || '''s Workspace';

  -- 1. Create the organization
  INSERT INTO public.organizations (name, plan, product_limit, created_by)
  VALUES (org_name, 'free', 1, NEW.id)
  RETURNING id INTO org_id;

  -- 2. Create the profile with organization linked
  INSERT INTO public.profiles (id, email, role, organization_id, active_organization_id)
  VALUES (
    NEW.id,
    NEW.email,
    'owner',
    org_id,
    org_id
  );

  -- 3. Add user to organization_members as owner
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger already exists from migration 007, but recreate it to be sure
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also create a function to setup existing users who don't have organizations
-- This can be called manually for any users that slipped through
CREATE OR REPLACE FUNCTION public.setup_user_organization(user_id UUID)
RETURNS UUID AS $$
DECLARE
  org_id UUID;
  org_name TEXT;
  user_email TEXT;
  existing_org_id UUID;
BEGIN
  -- Check if user already has an organization
  SELECT organization_id INTO existing_org_id
  FROM public.profiles
  WHERE id = user_id;

  IF existing_org_id IS NOT NULL THEN
    RETURN existing_org_id;
  END IF;

  -- Get user email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_id;

  IF user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Create organization name
  org_name := COALESCE(
    split_part(user_email, '@', 1),
    'User'
  ) || '''s Workspace';

  -- Create the organization
  INSERT INTO public.organizations (name, plan, product_limit, created_by)
  VALUES (org_name, 'free', 1, user_id)
  RETURNING id INTO org_id;

  -- Update the profile
  UPDATE public.profiles
  SET
    organization_id = org_id,
    active_organization_id = org_id,
    role = 'owner'
  WHERE id = user_id;

  -- Add to organization_members
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (org_id, user_id, 'owner')
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (so they can set up their own org)
GRANT EXECUTE ON FUNCTION public.setup_user_organization(UUID) TO authenticated;

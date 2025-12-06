-- Remove automatic organization creation from user signup trigger
-- Organizations should now only be created during the onboarding flow
-- This allows us to collect the organization name from the user

-- Update the handle_new_user function to NOT create an organization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create the profile - organization will be created during onboarding
  INSERT INTO public.profiles (id, email, role, onboarding_complete)
  VALUES (
    NEW.id,
    NEW.email,
    'member',
    false
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger already exists, just updating the function is enough

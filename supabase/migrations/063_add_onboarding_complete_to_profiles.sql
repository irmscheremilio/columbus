-- Add onboarding_complete column to profiles table
ALTER TABLE profiles
ADD COLUMN onboarding_complete BOOLEAN DEFAULT FALSE;

-- Set existing users with organizations as having completed onboarding
UPDATE profiles
SET onboarding_complete = TRUE
WHERE organization_id IS NOT NULL;

-- Add index for filtering by onboarding status
CREATE INDEX idx_profiles_onboarding_complete ON profiles(onboarding_complete);

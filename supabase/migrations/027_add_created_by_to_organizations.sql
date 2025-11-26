-- Add created_by column to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update existing organizations to set created_by from the first profile that joined
UPDATE organizations o
SET created_by = (
  SELECT p.id
  FROM profiles p
  WHERE p.organization_id = o.id
  ORDER BY p.created_at ASC
  LIMIT 1
)
WHERE o.created_by IS NULL;

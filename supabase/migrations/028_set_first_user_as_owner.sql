-- Set existing users who are the first member of their organization as owners
UPDATE profiles p
SET role = 'owner'
WHERE p.role = 'member'
AND p.organization_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM profiles p2
  WHERE p2.organization_id = p.organization_id
  AND p2.id != p.id
  AND p2.created_at < p.created_at
);

-- Also update organization_members table if it exists and has entries
UPDATE organization_members om
SET role = 'owner'
WHERE om.role = 'member'
AND NOT EXISTS (
  SELECT 1 FROM organization_members om2
  WHERE om2.organization_id = om.organization_id
  AND om2.id != om.id
  AND om2.joined_at < om.joined_at
);

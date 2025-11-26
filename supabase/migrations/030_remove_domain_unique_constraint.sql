-- Remove unique constraint on organizations.domain
-- This allows multiple organizations to have the same website/domain
-- Use case: multiple businesses can operate from the same domain (e.g., different departments)

-- Drop the unique constraint on the domain column
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_domain_key;

-- Note: If the constraint was created with a different name, we can also use:
-- ALTER TABLE organizations ALTER COLUMN domain DROP NOT NULL;
-- But we only want to remove uniqueness, not nullability (domain is already nullable)

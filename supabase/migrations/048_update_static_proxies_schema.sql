-- Update static_proxies table to support multiple proxies per country with load balancing
-- This migration alters the existing table created in 047

-- First, drop the primary key constraint on country_code
ALTER TABLE static_proxies DROP CONSTRAINT IF EXISTS static_proxies_pkey;

-- Add new columns
ALTER TABLE static_proxies
    ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS weight INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 0;

-- Set id as primary key
ALTER TABLE static_proxies ADD PRIMARY KEY (id);

-- Add unique constraint on host:port to prevent duplicates
ALTER TABLE static_proxies ADD CONSTRAINT static_proxies_host_port_unique UNIQUE (host, port);

-- Add index for efficient country lookups
CREATE INDEX IF NOT EXISTS idx_static_proxies_country ON static_proxies(country_code, is_active);

-- Add comments
COMMENT ON COLUMN static_proxies.id IS 'Unique identifier for this proxy';
COMMENT ON COLUMN static_proxies.priority IS 'Higher priority proxies are preferred (manual override)';
COMMENT ON COLUMN static_proxies.weight IS 'Weight for load balancing - higher weight = more traffic';
COMMENT ON COLUMN static_proxies.usage_count IS 'Number of times this proxy has been used';
COMMENT ON COLUMN static_proxies.last_used_at IS 'Last time this proxy was used';

-- Add static proxy support for per-country static IP proxies
-- This replaces the expensive rotating residential proxies (IPRoyal) with cheaper static ISP proxies
-- Supports multiple proxies per country for load balancing and redundancy

-- Table to store static proxy credentials (multiple per country supported)
CREATE TABLE IF NOT EXISTS static_proxies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code TEXT NOT NULL REFERENCES proxy_countries(code),
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    username TEXT, -- Optional auth
    password TEXT, -- Optional auth
    proxy_type TEXT NOT NULL DEFAULT 'http', -- 'http', 'https', 'socks5'
    provider TEXT, -- e.g., 'proxyseller', 'rayobyte', etc.
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 0, -- Higher = preferred (for manual override)
    weight INTEGER NOT NULL DEFAULT 1, -- For weighted round-robin selection
    last_used_at TIMESTAMPTZ, -- For least-recently-used selection
    usage_count INTEGER NOT NULL DEFAULT 0, -- Track usage for load balancing
    notes TEXT, -- Admin notes
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Ensure unique host:port combinations
    UNIQUE(host, port)
);

-- Index for efficient country lookups
CREATE INDEX idx_static_proxies_country ON static_proxies(country_code, is_active);

-- RLS: Only accessible via Edge Function (like proxy_config)
ALTER TABLE static_proxies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to static_proxies"
    ON static_proxies
    FOR SELECT
    USING (false);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_static_proxies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_static_proxies_updated_at
    BEFORE UPDATE ON static_proxies
    FOR EACH ROW
    EXECUTE FUNCTION update_static_proxies_updated_at();

-- Function to get next proxy for a country (weighted round-robin with priority)
-- Returns the best proxy based on: priority (highest first), then weight/usage ratio
CREATE OR REPLACE FUNCTION get_next_proxy_for_country(p_country_code TEXT)
RETURNS TABLE (
    proxy_id UUID,
    host TEXT,
    port INTEGER,
    username TEXT,
    password TEXT,
    proxy_type TEXT
) AS $$
DECLARE
    selected_proxy RECORD;
BEGIN
    -- Select proxy with highest priority, then by weighted least-used
    SELECT sp.id, sp.host, sp.port, sp.username, sp.password, sp.proxy_type
    INTO selected_proxy
    FROM static_proxies sp
    WHERE sp.country_code = p_country_code
      AND sp.is_active = true
    ORDER BY
        sp.priority DESC,
        (sp.usage_count::float / GREATEST(sp.weight, 1)) ASC,
        sp.last_used_at ASC NULLS FIRST
    LIMIT 1;

    IF selected_proxy IS NOT NULL THEN
        -- Update usage stats
        UPDATE static_proxies
        SET usage_count = usage_count + 1,
            last_used_at = NOW()
        WHERE id = selected_proxy.id;

        RETURN QUERY SELECT
            selected_proxy.id,
            selected_proxy.host,
            selected_proxy.port,
            selected_proxy.username,
            selected_proxy.password,
            selected_proxy.proxy_type;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON TABLE static_proxies IS 'Static proxy credentials per country - supports multiple proxies per country for load balancing';
COMMENT ON COLUMN static_proxies.id IS 'Unique identifier for this proxy';
COMMENT ON COLUMN static_proxies.country_code IS 'Country code from proxy_countries table';
COMMENT ON COLUMN static_proxies.host IS 'Proxy host/IP address';
COMMENT ON COLUMN static_proxies.port IS 'Proxy port';
COMMENT ON COLUMN static_proxies.proxy_type IS 'Type of proxy: http, https, or socks5';
COMMENT ON COLUMN static_proxies.priority IS 'Higher priority proxies are preferred (manual override)';
COMMENT ON COLUMN static_proxies.weight IS 'Weight for load balancing - higher weight = more traffic';
COMMENT ON COLUMN static_proxies.usage_count IS 'Number of times this proxy has been used';
COMMENT ON COLUMN static_proxies.last_used_at IS 'Last time this proxy was used';

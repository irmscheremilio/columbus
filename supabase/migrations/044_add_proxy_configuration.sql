-- Add proxy configuration for geo-targeted scanning
-- Proxy credentials are only accessible to paid users

-- Table to store proxy service credentials (admin-managed)
CREATE TABLE IF NOT EXISTS proxy_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL DEFAULT 'iproyal',
    hostname TEXT NOT NULL,
    port_http INTEGER NOT NULL DEFAULT 12321,
    port_socks5 INTEGER NOT NULL DEFAULT 32325,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table of supported countries for geo-targeting
CREATE TABLE IF NOT EXISTS proxy_countries (
    code TEXT PRIMARY KEY, -- ISO 3166-1 alpha-2 (e.g., 'us', 'de', 'gb')
    name TEXT NOT NULL,
    flag_emoji TEXT,
    region TEXT, -- e.g., 'northamerica', 'europe', 'asiapacific'
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 100
);

-- Insert IPRoyal default config (credentials to be updated manually in Supabase dashboard)
INSERT INTO proxy_config (provider, hostname, port_http, port_socks5, username, password)
VALUES ('iproyal', 'geo.iproyal.com', 12321, 32325, 'CHANGE_ME', 'CHANGE_ME')
ON CONFLICT DO NOTHING;

-- Insert common countries for geo-targeting
INSERT INTO proxy_countries (code, name, flag_emoji, region, sort_order) VALUES
    ('us', 'United States', '🇺🇸', 'northamerica', 1),
    ('gb', 'United Kingdom', '🇬🇧', 'europe', 2),
    ('de', 'Germany', '🇩🇪', 'europe', 3),
    ('fr', 'France', '🇫🇷', 'europe', 4),
    ('es', 'Spain', '🇪🇸', 'europe', 5),
    ('it', 'Italy', '🇮🇹', 'europe', 6),
    ('nl', 'Netherlands', '🇳🇱', 'europe', 7),
    ('be', 'Belgium', '🇧🇪', 'europe', 8),
    ('at', 'Austria', '🇦🇹', 'europe', 9),
    ('ch', 'Switzerland', '🇨🇭', 'europe', 10),
    ('se', 'Sweden', '🇸🇪', 'europe', 11),
    ('no', 'Norway', '🇳🇴', 'europe', 12),
    ('dk', 'Denmark', '🇩🇰', 'europe', 13),
    ('fi', 'Finland', '🇫🇮', 'europe', 14),
    ('pl', 'Poland', '🇵🇱', 'europe', 15),
    ('pt', 'Portugal', '🇵🇹', 'europe', 16),
    ('ie', 'Ireland', '🇮🇪', 'europe', 17),
    ('ca', 'Canada', '🇨🇦', 'northamerica', 20),
    ('mx', 'Mexico', '🇲🇽', 'northamerica', 21),
    ('br', 'Brazil', '🇧🇷', 'southlatinamerica', 30),
    ('ar', 'Argentina', '🇦🇷', 'southlatinamerica', 31),
    ('cl', 'Chile', '🇨🇱', 'southlatinamerica', 32),
    ('co', 'Colombia', '🇨🇴', 'southlatinamerica', 33),
    ('au', 'Australia', '🇦🇺', 'asiapacific', 40),
    ('nz', 'New Zealand', '🇳🇿', 'asiapacific', 41),
    ('jp', 'Japan', '🇯🇵', 'asiapacific', 42),
    ('kr', 'South Korea', '🇰🇷', 'asiapacific', 43),
    ('sg', 'Singapore', '🇸🇬', 'asiapacific', 44),
    ('hk', 'Hong Kong', '🇭🇰', 'asiapacific', 45),
    ('in', 'India', '🇮🇳', 'asiapacific', 46),
    ('ae', 'United Arab Emirates', '🇦🇪', 'middleeast', 50),
    ('il', 'Israel', '🇮🇱', 'middleeast', 51),
    ('za', 'South Africa', '🇿🇦', 'africa', 60)
ON CONFLICT (code) DO NOTHING;

-- RLS policies: proxy_config is only readable by authenticated users with paid plans
ALTER TABLE proxy_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE proxy_countries ENABLE ROW LEVEL SECURITY;

-- proxy_config: Only paid users can read (checked via Edge Function, but RLS as backup)
-- No direct access - must go through Edge Function which checks plan
CREATE POLICY "No direct access to proxy_config"
    ON proxy_config
    FOR SELECT
    USING (false);

-- proxy_countries: All authenticated users can read the country list
CREATE POLICY "Authenticated users can read proxy_countries"
    ON proxy_countries
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Add scan_countries to products table for multi-country scanning
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS scan_countries TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Comment for documentation
COMMENT ON TABLE proxy_config IS 'Proxy service credentials - only accessible via Edge Function for paid users';
COMMENT ON TABLE proxy_countries IS 'List of supported countries for geo-targeted scanning';
COMMENT ON COLUMN products.scan_countries IS 'Array of country codes to scan this product in (empty = user location)';

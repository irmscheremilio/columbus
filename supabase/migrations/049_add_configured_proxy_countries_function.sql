-- Add function to get list of countries that have proxies configured
-- This allows the frontend to know which regions are available without exposing proxy credentials

-- Function to get configured proxy country codes (safe - no credentials exposed)
CREATE OR REPLACE FUNCTION get_configured_proxy_countries()
RETURNS TABLE (country_code TEXT)
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT sp.country_code
    FROM static_proxies sp
    WHERE sp.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_configured_proxy_countries() TO authenticated;

COMMENT ON FUNCTION get_configured_proxy_countries() IS 'Returns list of country codes that have active proxy configurations';

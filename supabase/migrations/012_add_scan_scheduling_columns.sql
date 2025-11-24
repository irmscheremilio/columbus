-- Add scheduling columns to organizations table

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS last_scan_at TIMESTAMPTZ;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS scan_frequency TEXT DEFAULT 'weekly';

-- Add index for efficient scheduling queries
CREATE INDEX IF NOT EXISTS idx_organizations_last_scan_at ON organizations(last_scan_at);

-- Update subscriptions table to track scan limits
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS scans_remaining INTEGER;

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS scans_reset_at TIMESTAMPTZ;

-- Function to reset scan counts monthly
CREATE OR REPLACE FUNCTION reset_subscription_scans()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET
    scans_remaining = CASE
      WHEN plan_type = 'free' THEN 1
      WHEN plan_type = 'pro' THEN 4  -- Weekly for a month
      WHEN plan_type = 'agency' THEN 10
      WHEN plan_type = 'enterprise' THEN 30
      ELSE 1
    END,
    scans_reset_at = NOW() + INTERVAL '1 month'
  WHERE scans_reset_at IS NULL OR scans_reset_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to reset scans monthly (if pg_cron is available)
-- This would typically be run from the application scheduler instead
COMMENT ON FUNCTION reset_subscription_scans() IS 'Resets monthly scan allowances for all subscriptions';

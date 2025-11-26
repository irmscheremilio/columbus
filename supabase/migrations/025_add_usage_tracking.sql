-- Monthly usage tracking for plan limit enforcement
CREATE TABLE monthly_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: '2025-01'
  prompts_used INT DEFAULT 0,
  scans_used INT DEFAULT 0,
  website_analyses_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, month_year)
);

-- Indexes for performance
CREATE INDEX idx_monthly_usage_org ON monthly_usage(organization_id);
CREATE INDEX idx_monthly_usage_month ON monthly_usage(month_year);

-- Enable RLS
ALTER TABLE monthly_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their organization's usage
CREATE POLICY "Users can view their organization's usage"
  ON monthly_usage FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Service role can manage usage (for worker updates)
CREATE POLICY "Service role full access on usage"
  ON monthly_usage FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_monthly_usage_updated_at BEFORE UPDATE ON monthly_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment usage (used by API endpoints)
CREATE OR REPLACE FUNCTION increment_usage(
  p_organization_id UUID,
  p_usage_type TEXT
) RETURNS void AS $$
DECLARE
  v_month_year TEXT;
BEGIN
  v_month_year := to_char(NOW(), 'YYYY-MM');

  -- Insert or update usage record
  INSERT INTO monthly_usage (organization_id, month_year)
  VALUES (p_organization_id, v_month_year)
  ON CONFLICT (organization_id, month_year) DO NOTHING;

  -- Increment the appropriate counter
  IF p_usage_type = 'prompts' THEN
    UPDATE monthly_usage
    SET prompts_used = prompts_used + 1, updated_at = NOW()
    WHERE organization_id = p_organization_id AND month_year = v_month_year;
  ELSIF p_usage_type = 'scans' THEN
    UPDATE monthly_usage
    SET scans_used = scans_used + 1, updated_at = NOW()
    WHERE organization_id = p_organization_id AND month_year = v_month_year;
  ELSIF p_usage_type = 'website_analyses' THEN
    UPDATE monthly_usage
    SET website_analyses_used = website_analyses_used + 1, updated_at = NOW()
    WHERE organization_id = p_organization_id AND month_year = v_month_year;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current usage (for limit checking)
CREATE OR REPLACE FUNCTION get_current_usage(
  p_organization_id UUID
) RETURNS TABLE (
  prompts_used INT,
  scans_used INT,
  website_analyses_used INT
) AS $$
DECLARE
  v_month_year TEXT;
BEGIN
  v_month_year := to_char(NOW(), 'YYYY-MM');

  RETURN QUERY
  SELECT
    COALESCE(mu.prompts_used, 0),
    COALESCE(mu.scans_used, 0),
    COALESCE(mu.website_analyses_used, 0)
  FROM monthly_usage mu
  WHERE mu.organization_id = p_organization_id
    AND mu.month_year = v_month_year;

  -- If no record exists, return zeros
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, 0, 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

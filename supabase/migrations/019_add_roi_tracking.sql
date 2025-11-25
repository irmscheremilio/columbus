-- ROI Calculator and Analytics Integration
-- Tracks conversions and calculates ROI from AI visibility

-- GA4 integration settings per organization
CREATE TABLE IF NOT EXISTS analytics_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  provider TEXT NOT NULL DEFAULT 'ga4' CHECK (provider IN ('ga4', 'plausible', 'manual')),
  is_connected BOOLEAN DEFAULT false,
  -- GA4 specific fields
  ga4_property_id TEXT,
  ga4_measurement_id TEXT,
  access_token TEXT, -- Encrypted
  refresh_token TEXT, -- Encrypted
  token_expires_at TIMESTAMPTZ,
  -- General settings
  conversion_goal TEXT, -- e.g., 'purchase', 'signup', 'demo_request'
  average_conversion_value DECIMAL(10, 2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  -- Metadata
  last_synced_at TIMESTAMPTZ,
  sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Traffic sources tracking (AI referrals)
CREATE TABLE IF NOT EXISTS ai_referral_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL, -- 'chatgpt', 'claude', 'perplexity', 'gemini', etc.
  referrer_pattern TEXT NOT NULL, -- URL pattern to match (regex)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default AI referral sources
INSERT INTO ai_referral_sources (organization_id, source_name, referrer_pattern, is_active) VALUES
  (NULL, 'chatgpt', '.*chat\.openai\.com.*|.*chatgpt\.com.*', true),
  (NULL, 'claude', '.*claude\.ai.*', true),
  (NULL, 'perplexity', '.*perplexity\.ai.*', true),
  (NULL, 'gemini', '.*gemini\.google\.com.*|.*bard\.google\.com.*', true),
  (NULL, 'copilot', '.*copilot\.microsoft\.com.*|.*bing\.com/chat.*', true),
  (NULL, 'you', '.*you\.com.*', true)
ON CONFLICT DO NOTHING;

-- Daily traffic metrics from AI sources
CREATE TABLE IF NOT EXISTS ai_traffic_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  source TEXT NOT NULL, -- AI model/platform
  sessions INTEGER DEFAULT 0,
  users INTEGER DEFAULT 0,
  pageviews INTEGER DEFAULT 0,
  avg_session_duration DECIMAL(10, 2) DEFAULT 0.00, -- seconds
  bounce_rate DECIMAL(5, 2) DEFAULT 0.00, -- percentage
  conversions INTEGER DEFAULT 0,
  conversion_value DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, date, source)
);

-- Conversion events from AI referrals
CREATE TABLE IF NOT EXISTS ai_conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL, -- e.g., 'purchase', 'signup', 'demo_request'
  source TEXT NOT NULL, -- AI model/platform that referred
  value DECIMAL(10, 2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  session_id TEXT,
  user_id TEXT, -- Anonymous GA user ID
  landing_page TEXT,
  metadata JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROI calculations (cached daily)
CREATE TABLE IF NOT EXISTS roi_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  -- Traffic metrics
  total_ai_sessions INTEGER DEFAULT 0,
  total_ai_users INTEGER DEFAULT 0,
  total_ai_pageviews INTEGER DEFAULT 0,
  -- Conversion metrics
  total_conversions INTEGER DEFAULT 0,
  total_conversion_value DECIMAL(10, 2) DEFAULT 0.00,
  conversion_rate DECIMAL(5, 4) DEFAULT 0.0000, -- percentage as decimal
  -- ROI metrics
  estimated_traffic_value DECIMAL(10, 2) DEFAULT 0.00, -- Based on avg CPC alternative
  platform_cost DECIMAL(10, 2) DEFAULT 0.00, -- Columbus subscription cost
  net_roi DECIMAL(10, 2) DEFAULT 0.00,
  roi_percentage DECIMAL(10, 2) DEFAULT 0.00,
  -- Breakdown by source
  breakdown_by_source JSONB DEFAULT '{}',
  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, period_start, period_end)
);

-- Manual conversion tracking for organizations without GA4
CREATE TABLE IF NOT EXISTS manual_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  source TEXT NOT NULL, -- AI model/platform
  conversions INTEGER DEFAULT 0,
  conversion_value DECIMAL(10, 2) DEFAULT 0.00,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_integrations_org ON analytics_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_traffic_metrics_org_date ON ai_traffic_metrics(organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversion_events_org ON ai_conversion_events(organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_roi_calculations_org ON roi_calculations(organization_id, period_end DESC);

-- Enable RLS
ALTER TABLE analytics_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_referral_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_traffic_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_conversions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization's analytics integrations"
  ON analytics_integrations FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can manage their organization's analytics integrations"
  ON analytics_integrations FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can view AI referral sources"
  ON ai_referral_sources FOR SELECT
  USING (
    organization_id IS NULL OR -- Global sources
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can view their organization's traffic metrics"
  ON ai_traffic_metrics FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can view their organization's conversion events"
  ON ai_conversion_events FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can view their organization's ROI calculations"
  ON roi_calculations FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can manage their organization's manual conversions"
  ON manual_conversions FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
  ));

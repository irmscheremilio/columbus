-- Freshness tracking for monitored pages
-- Track content age, schedule updates, alert on stale content

CREATE TABLE IF NOT EXISTS monitored_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  last_crawled_at TIMESTAMPTZ,
  last_modified_at TIMESTAMPTZ, -- From HTTP headers or page content
  content_hash TEXT, -- To detect actual content changes
  word_count INTEGER,
  freshness_score INTEGER CHECK (freshness_score >= 0 AND freshness_score <= 100),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  check_frequency_hours INTEGER DEFAULT 72, -- How often to check (default 72 hours)
  next_check_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, url)
);

-- Content snapshots for change tracking
CREATE TABLE IF NOT EXISTS content_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES monitored_pages(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  word_count INTEGER,
  h1_text TEXT,
  meta_description TEXT,
  schema_types TEXT[], -- Array of detected schema types
  last_modified_header TIMESTAMPTZ,
  crawled_at TIMESTAMPTZ DEFAULT NOW()
);

-- Freshness alerts
CREATE TABLE IF NOT EXISTS freshness_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  page_id UUID REFERENCES monitored_pages(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('stale_content', 'content_changed', 'crawl_error', 'competitor_updated')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ
);

-- Freshness settings per organization
CREATE TABLE IF NOT EXISTS freshness_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  stale_threshold_days INTEGER DEFAULT 30, -- Alert after X days without update
  critical_threshold_days INTEGER DEFAULT 90, -- Critical alert after X days
  auto_check_enabled BOOLEAN DEFAULT true,
  email_alerts_enabled BOOLEAN DEFAULT true,
  slack_webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monitored_pages_org ON monitored_pages(organization_id);
CREATE INDEX IF NOT EXISTS idx_monitored_pages_next_check ON monitored_pages(next_check_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_content_snapshots_page ON content_snapshots(page_id);
CREATE INDEX IF NOT EXISTS idx_freshness_alerts_org ON freshness_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_freshness_alerts_unread ON freshness_alerts(organization_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE monitored_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE freshness_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE freshness_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization's monitored pages"
  ON monitored_pages FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can manage their organization's monitored pages"
  ON monitored_pages FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can view their organization's content snapshots"
  ON content_snapshots FOR SELECT
  USING (page_id IN (
    SELECT id FROM monitored_pages WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
    )
  ));

CREATE POLICY "Users can view their organization's freshness alerts"
  ON freshness_alerts FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can manage their organization's freshness alerts"
  ON freshness_alerts FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can view their organization's freshness settings"
  ON freshness_settings FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can manage their organization's freshness settings"
  ON freshness_settings FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
  ));

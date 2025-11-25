-- Reports table for storing generated PDF reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('executive_summary', 'detailed', 'competitor_analysis')),
  file_path TEXT NOT NULL,
  download_url TEXT,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_reports_org ON reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(organization_id, created_at DESC);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policy - users can view their organization's reports
CREATE POLICY "Users can view their organization's reports"
  ON reports FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
  ));

-- RLS Policy - users can manage their organization's reports
CREATE POLICY "Users can manage their organization's reports"
  ON reports FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
  ));

-- Create reports storage bucket (run this in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false);

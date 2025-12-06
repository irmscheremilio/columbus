-- Create website_analysis_progress table for realtime progress updates
CREATE TABLE website_analysis_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,

  -- Progress tracking
  current_step TEXT NOT NULL DEFAULT 'initializing',
  step_number INTEGER NOT NULL DEFAULT 0,
  total_steps INTEGER NOT NULL DEFAULT 6,
  progress_percent INTEGER NOT NULL DEFAULT 0,

  -- Current activity details
  message TEXT NOT NULL DEFAULT 'Starting analysis...',
  details JSONB DEFAULT '{}',

  -- Page discovery stats
  pages_discovered INTEGER DEFAULT 0,
  pages_analyzed INTEGER DEFAULT 0,
  current_page_url TEXT,
  current_page_title TEXT,

  -- Prompt generation stats
  prompts_generated INTEGER DEFAULT 0,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for efficient querying
CREATE INDEX idx_wap_job_id ON website_analysis_progress(job_id);
CREATE INDEX idx_wap_organization_id ON website_analysis_progress(organization_id);
CREATE INDEX idx_wap_product_id ON website_analysis_progress(product_id);

-- Enable RLS
ALTER TABLE website_analysis_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view progress for their organization
CREATE POLICY "Users can view their organization's analysis progress"
  ON website_analysis_progress
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
      UNION
      SELECT active_organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Service role can insert/update (worker uses service role)
CREATE POLICY "Service role can manage analysis progress"
  ON website_analysis_progress
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE website_analysis_progress;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_website_analysis_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_website_analysis_progress_timestamp
  BEFORE UPDATE ON website_analysis_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_website_analysis_progress_updated_at();

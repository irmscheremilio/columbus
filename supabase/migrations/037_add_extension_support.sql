-- Add source column to track where scan results came from (server vs browser extension)
ALTER TABLE prompt_results
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'server'
CHECK (source IN ('server', 'extension'));

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS idx_prompt_results_source ON prompt_results(source);

-- Extension sessions table for tracking extension usage and analytics
CREATE TABLE IF NOT EXISTS extension_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  browser TEXT,
  extension_version TEXT,
  last_scan_at TIMESTAMPTZ,
  platforms_connected JSONB DEFAULT '{}', -- { chatgpt: true, claude: false, ... }
  scan_preferences JSONB DEFAULT '{}', -- { reminderEnabled: true, preferredTimeWindow: { start: 9, end: 18 } }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for extension sessions
CREATE INDEX IF NOT EXISTS idx_extension_sessions_user ON extension_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_extension_sessions_org ON extension_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_extension_sessions_product ON extension_sessions(product_id);

-- Enable RLS on extension_sessions
ALTER TABLE extension_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can manage their own extension sessions
CREATE POLICY "Users can manage their own extension sessions"
  ON extension_sessions FOR ALL
  USING (user_id = (SELECT auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_extension_sessions_updated_at
  BEFORE UPDATE ON extension_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

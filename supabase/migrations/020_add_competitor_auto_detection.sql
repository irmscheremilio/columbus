-- Add auto-detection fields to competitors table

-- Add new columns for auto-detection
ALTER TABLE competitors
  ADD COLUMN IF NOT EXISTS is_auto_detected BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS detection_confidence INTEGER CHECK (detection_confidence >= 0 AND detection_confidence <= 100),
  ADD COLUMN IF NOT EXISTS detection_context TEXT,
  ADD COLUMN IF NOT EXISTS detection_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending_review', 'suggested', 'rejected')),
  ADD COLUMN IF NOT EXISTS last_detected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Index for pending reviews
CREATE INDEX IF NOT EXISTS idx_competitors_pending_review
  ON competitors(organization_id, status)
  WHERE is_auto_detected = true;

-- Table to track competitor mentions in AI responses
CREATE TABLE IF NOT EXISTS competitor_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES competitors(id) ON DELETE CASCADE,
  prompt_result_id UUID REFERENCES prompt_results(id) ON DELETE CASCADE,
  ai_model TEXT NOT NULL,
  mention_context TEXT,
  position INTEGER, -- Position in the response (1st, 2nd, etc)
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for competitor mentions
CREATE INDEX IF NOT EXISTS idx_competitor_mentions_competitor
  ON competitor_mentions(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_mentions_org
  ON competitor_mentions(organization_id, detected_at DESC);

-- Enable RLS
ALTER TABLE competitor_mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view their organization's competitor mentions"
  ON competitor_mentions FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
  ));

-- Update competitors RLS to include new fields
DROP POLICY IF EXISTS "Users can view their organization's competitors" ON competitors;
DROP POLICY IF EXISTS "Users can manage their organization's competitors" ON competitors;

CREATE POLICY "Users can view their organization's competitors"
  ON competitors FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can manage their organization's competitors"
  ON competitors FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
  ));

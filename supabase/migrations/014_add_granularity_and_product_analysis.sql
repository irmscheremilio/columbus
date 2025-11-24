-- Add granularity level to prompts table
ALTER TABLE prompts
ADD COLUMN IF NOT EXISTS granularity_level INTEGER DEFAULT 1 CHECK (granularity_level >= 1 AND granularity_level <= 5),
ADD COLUMN IF NOT EXISTS parent_prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL;

-- Make domain required for organizations (add NOT NULL constraint)
-- First update any NULL domains to a placeholder
UPDATE organizations SET domain = '' WHERE domain IS NULL;

-- Create product analysis table to store AI understanding of the website
CREATE TABLE IF NOT EXISTS product_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  domain TEXT NOT NULL,
  product_name TEXT,
  product_description TEXT,
  key_features JSONB,
  target_audience TEXT,
  use_cases JSONB,
  differentiators TEXT[],
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for product analyses
CREATE INDEX IF NOT EXISTS idx_product_analyses_org ON product_analyses(organization_id);

-- Enable RLS for product analyses
ALTER TABLE product_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policy for product analyses
CREATE POLICY "Users can view their organization's product analysis"
  ON product_analyses FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid())
  ));

CREATE POLICY "Users can manage their organization's product analysis"
  ON product_analyses FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = (SELECT auth.uid()) AND role IN ('owner', 'admin')
  ));

-- Add columns to track website analysis status
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS website_analyzed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_scan_at TIMESTAMPTZ;

-- Add index for prompts granularity
CREATE INDEX IF NOT EXISTS idx_prompts_granularity ON prompts(granularity_level);
CREATE INDEX IF NOT EXISTS idx_prompts_parent ON prompts(parent_prompt_id);

-- Add citation tracking to prompt results for granularity metrics
ALTER TABLE prompt_results
ADD COLUMN IF NOT EXISTS cited_at_granularity INTEGER,
ADD COLUMN IF NOT EXISTS prompt_granularity_level INTEGER;

-- Create index for granularity metrics
CREATE INDEX IF NOT EXISTS idx_prompt_results_granularity ON prompt_results(prompt_granularity_level);

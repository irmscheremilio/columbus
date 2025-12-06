-- Create subscription_tiers table to store plan information
CREATE TABLE subscription_tiers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  tagline TEXT,
  icon TEXT, -- Icon name/identifier
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,

  -- Pricing
  monthly_price INTEGER NOT NULL DEFAULT 0, -- in cents
  yearly_price INTEGER NOT NULL DEFAULT 0, -- in cents
  stripe_monthly_price_id TEXT,
  stripe_yearly_price_id TEXT,

  -- Limits (-1 = unlimited)
  product_limit INTEGER DEFAULT 1,
  prompts_per_month INTEGER DEFAULT 5,
  competitors_limit INTEGER DEFAULT 1,
  scans_per_month INTEGER DEFAULT 2,
  website_analyses_limit INTEGER DEFAULT 1,

  -- Features (stored as JSONB array of feature objects)
  features JSONB DEFAULT '[]'::jsonb,

  -- Highlight features for landing page (simpler list)
  highlight_features JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;

-- Allow public read access (tiers are public info)
CREATE POLICY "Anyone can view subscription tiers"
  ON subscription_tiers
  FOR SELECT
  TO public
  USING (true);

-- Insert default tiers
INSERT INTO subscription_tiers (
  id, name, description, tagline, icon, is_popular, sort_order,
  monthly_price, yearly_price,
  product_limit, prompts_per_month, competitors_limit, scans_per_month, website_analyses_limit,
  features, highlight_features
) VALUES
(
  'free',
  'Free',
  'Perfect for exploring AI visibility optimization',
  'Get started',
  'clock',
  false,
  1,
  0, 0,
  1, 10, 1, 2, 1,
  '[
    {"text": "1 product", "included": true},
    {"text": "10 prompts per product", "included": true},
    {"text": "All 6 AI platforms", "included": true},
    {"text": "Desktop app included", "included": true},
    {"text": "Visibility tracking", "included": true}
  ]'::jsonb,
  '["1 product", "10 prompts per product", "All 6 AI platforms", "Desktop app included", "Visibility tracking"]'::jsonb
),
(
  'pro',
  'Pro',
  'For businesses serious about AI visibility',
  'Most popular',
  'bolt',
  true,
  2,
  4900, 49000, -- $49/month, $490/year (10 months)
  5, -1, 10, -1, -1,
  '[
    {"text": "5 products", "included": true},
    {"text": "100 prompts per product", "included": true},
    {"text": "Competitor tracking", "included": true},
    {"text": "Citation & source tracking", "included": true},
    {"text": "Actionable recommendations", "included": true},
    {"text": "Multi-region support", "included": true},
    {"text": "ROI & AI behaviour tracking with website SDK", "included": true}
  ]'::jsonb,
  '["5 products", "100 prompts per product", "Competitor tracking", "Citation & source tracking", "Actionable recommendations", "Multi-region support", "ROI & AI behaviour tracking with website SDK"]'::jsonb
),
(
  'scaling',
  'Scaling',
  'For growing teams that need more capacity',
  'Scale up',
  'chart-line',
  false,
  3,
  14900, 149000, -- $149/month, $1490/year (10 months)
  -1, -1, 50, -1, -1,
  '[
    {"text": "Everything in Pro", "included": true},
    {"text": "Unlimited products", "included": true},
    {"text": "Unlimited prompts", "included": true},
    {"text": "White-label reports", "included": true},
    {"text": "Team collaboration", "included": true},
    {"text": "Priority support", "included": true}
  ]'::jsonb,
  '["Everything in Pro", "Unlimited products", "Unlimited prompts", "White-label reports", "Team collaboration", "Priority support"]'::jsonb
);

-- Create index for ordering
CREATE INDEX idx_subscription_tiers_sort_order ON subscription_tiers(sort_order);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_subscription_tiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscription_tiers_updated_at
  BEFORE UPDATE ON subscription_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_tiers_updated_at();

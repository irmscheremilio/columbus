-- Migration: Add product_id to all remaining tables that were missed in 031
-- This completes the multi-product architecture by linking all data tables to products

-- 1. Freshness tracking tables
ALTER TABLE monitored_pages ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE freshness_alerts ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE freshness_settings ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;

-- 2. Reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;

-- 3. ROI/Analytics tables
ALTER TABLE analytics_integrations ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE ai_traffic_metrics ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE ai_conversion_events ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE roi_calculations ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE manual_conversions ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;

-- 4. Visibility gaps (from competitor analysis)
ALTER TABLE visibility_gaps ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;

-- 5. Create indexes for all new product_id columns
CREATE INDEX IF NOT EXISTS idx_monitored_pages_product ON monitored_pages(product_id);
CREATE INDEX IF NOT EXISTS idx_freshness_alerts_product ON freshness_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_freshness_settings_product ON freshness_settings(product_id);
CREATE INDEX IF NOT EXISTS idx_reports_product ON reports(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_integrations_product ON analytics_integrations(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_traffic_metrics_product ON ai_traffic_metrics(product_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversion_events_product ON ai_conversion_events(product_id);
CREATE INDEX IF NOT EXISTS idx_roi_calculations_product ON roi_calculations(product_id);
CREATE INDEX IF NOT EXISTS idx_manual_conversions_product ON manual_conversions(product_id);
CREATE INDEX IF NOT EXISTS idx_visibility_gaps_product ON visibility_gaps(product_id);

-- 6. Migrate existing data to link to first active product of their organization

-- Monitored pages
UPDATE monitored_pages mp
SET product_id = (
  SELECT p.id FROM products p
  WHERE p.organization_id = mp.organization_id AND p.is_active = true
  ORDER BY p.created_at ASC LIMIT 1
)
WHERE mp.product_id IS NULL AND mp.organization_id IS NOT NULL;

-- Freshness alerts
UPDATE freshness_alerts fa
SET product_id = (
  SELECT p.id FROM products p
  WHERE p.organization_id = fa.organization_id AND p.is_active = true
  ORDER BY p.created_at ASC LIMIT 1
)
WHERE fa.product_id IS NULL AND fa.organization_id IS NOT NULL;

-- Freshness settings
UPDATE freshness_settings fs
SET product_id = (
  SELECT p.id FROM products p
  WHERE p.organization_id = fs.organization_id AND p.is_active = true
  ORDER BY p.created_at ASC LIMIT 1
)
WHERE fs.product_id IS NULL AND fs.organization_id IS NOT NULL;

-- Reports
UPDATE reports r
SET product_id = (
  SELECT p.id FROM products p
  WHERE p.organization_id = r.organization_id AND p.is_active = true
  ORDER BY p.created_at ASC LIMIT 1
)
WHERE r.product_id IS NULL AND r.organization_id IS NOT NULL;

-- Analytics integrations
UPDATE analytics_integrations ai
SET product_id = (
  SELECT p.id FROM products p
  WHERE p.organization_id = ai.organization_id AND p.is_active = true
  ORDER BY p.created_at ASC LIMIT 1
)
WHERE ai.product_id IS NULL AND ai.organization_id IS NOT NULL;

-- AI traffic metrics
UPDATE ai_traffic_metrics atm
SET product_id = (
  SELECT p.id FROM products p
  WHERE p.organization_id = atm.organization_id AND p.is_active = true
  ORDER BY p.created_at ASC LIMIT 1
)
WHERE atm.product_id IS NULL AND atm.organization_id IS NOT NULL;

-- AI conversion events
UPDATE ai_conversion_events ace
SET product_id = (
  SELECT p.id FROM products p
  WHERE p.organization_id = ace.organization_id AND p.is_active = true
  ORDER BY p.created_at ASC LIMIT 1
)
WHERE ace.product_id IS NULL AND ace.organization_id IS NOT NULL;

-- ROI calculations
UPDATE roi_calculations rc
SET product_id = (
  SELECT p.id FROM products p
  WHERE p.organization_id = rc.organization_id AND p.is_active = true
  ORDER BY p.created_at ASC LIMIT 1
)
WHERE rc.product_id IS NULL AND rc.organization_id IS NOT NULL;

-- Manual conversions
UPDATE manual_conversions mc
SET product_id = (
  SELECT p.id FROM products p
  WHERE p.organization_id = mc.organization_id AND p.is_active = true
  ORDER BY p.created_at ASC LIMIT 1
)
WHERE mc.product_id IS NULL AND mc.organization_id IS NOT NULL;

-- Visibility gaps
UPDATE visibility_gaps vg
SET product_id = (
  SELECT p.id FROM products p
  WHERE p.organization_id = vg.organization_id AND p.is_active = true
  ORDER BY p.created_at ASC LIMIT 1
)
WHERE vg.product_id IS NULL AND vg.organization_id IS NOT NULL;

-- 7. Update RLS policies to include product-based access

-- Monitored pages
DROP POLICY IF EXISTS "Users can view their organization's monitored pages" ON monitored_pages;
DROP POLICY IF EXISTS "Users can manage their organization's monitored pages" ON monitored_pages;

CREATE POLICY "Users can view their product's monitored pages"
  ON monitored_pages FOR SELECT
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN profiles pr ON p.organization_id = pr.organization_id
      WHERE pr.id = auth.uid()
    )
    OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their product's monitored pages"
  ON monitored_pages FOR ALL
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN profiles pr ON p.organization_id = pr.organization_id
      WHERE pr.id = auth.uid()
    )
    OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Freshness alerts
DROP POLICY IF EXISTS "Users can view their organization's freshness alerts" ON freshness_alerts;
DROP POLICY IF EXISTS "Users can manage their organization's freshness alerts" ON freshness_alerts;

CREATE POLICY "Users can view their product's freshness alerts"
  ON freshness_alerts FOR SELECT
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN profiles pr ON p.organization_id = pr.organization_id
      WHERE pr.id = auth.uid()
    )
    OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their product's freshness alerts"
  ON freshness_alerts FOR ALL
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN profiles pr ON p.organization_id = pr.organization_id
      WHERE pr.id = auth.uid()
    )
    OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Freshness settings
DROP POLICY IF EXISTS "Users can view their organization's freshness settings" ON freshness_settings;
DROP POLICY IF EXISTS "Users can manage their organization's freshness settings" ON freshness_settings;

CREATE POLICY "Users can view their product's freshness settings"
  ON freshness_settings FOR SELECT
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN profiles pr ON p.organization_id = pr.organization_id
      WHERE pr.id = auth.uid()
    )
    OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their product's freshness settings"
  ON freshness_settings FOR ALL
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN profiles pr ON p.organization_id = pr.organization_id
      WHERE pr.id = auth.uid()
    )
    OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Reports
DROP POLICY IF EXISTS "Users can view their organization's reports" ON reports;
DROP POLICY IF EXISTS "Users can manage their organization's reports" ON reports;

CREATE POLICY "Users can view their product's reports"
  ON reports FOR SELECT
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN profiles pr ON p.organization_id = pr.organization_id
      WHERE pr.id = auth.uid()
    )
    OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their product's reports"
  ON reports FOR ALL
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN profiles pr ON p.organization_id = pr.organization_id
      WHERE pr.id = auth.uid()
    )
    OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Analytics integrations
DROP POLICY IF EXISTS "Users can view their organization's analytics integrations" ON analytics_integrations;
DROP POLICY IF EXISTS "Users can manage their organization's analytics integrations" ON analytics_integrations;

CREATE POLICY "Users can view their product's analytics integrations"
  ON analytics_integrations FOR SELECT
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN profiles pr ON p.organization_id = pr.organization_id
      WHERE pr.id = auth.uid()
    )
    OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their product's analytics integrations"
  ON analytics_integrations FOR ALL
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN profiles pr ON p.organization_id = pr.organization_id
      WHERE pr.id = auth.uid()
    )
    OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- AI traffic metrics
DROP POLICY IF EXISTS "Users can view their organization's traffic metrics" ON ai_traffic_metrics;

CREATE POLICY "Users can view their product's traffic metrics"
  ON ai_traffic_metrics FOR SELECT
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN profiles pr ON p.organization_id = pr.organization_id
      WHERE pr.id = auth.uid()
    )
    OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- AI conversion events
DROP POLICY IF EXISTS "Users can view their organization's conversion events" ON ai_conversion_events;

CREATE POLICY "Users can view their product's conversion events"
  ON ai_conversion_events FOR SELECT
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN profiles pr ON p.organization_id = pr.organization_id
      WHERE pr.id = auth.uid()
    )
    OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ROI calculations
DROP POLICY IF EXISTS "Users can view their organization's ROI calculations" ON roi_calculations;

CREATE POLICY "Users can view their product's ROI calculations"
  ON roi_calculations FOR SELECT
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN profiles pr ON p.organization_id = pr.organization_id
      WHERE pr.id = auth.uid()
    )
    OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Manual conversions
DROP POLICY IF EXISTS "Users can manage their organization's manual conversions" ON manual_conversions;

CREATE POLICY "Users can manage their product's manual conversions"
  ON manual_conversions FOR ALL
  USING (
    product_id IN (
      SELECT p.id FROM products p
      JOIN profiles pr ON p.organization_id = pr.organization_id
      WHERE pr.id = auth.uid()
    )
    OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 8. Drop unique constraints that conflict with multi-product (org-level unique -> product-level unique)
-- These tables had UNIQUE on organization_id but now need to be unique on product_id

-- Freshness settings: Change from per-org unique to per-product unique
ALTER TABLE freshness_settings DROP CONSTRAINT IF EXISTS freshness_settings_organization_id_key;
ALTER TABLE freshness_settings ADD CONSTRAINT freshness_settings_product_unique UNIQUE (product_id);

-- Analytics integrations: Change from per-org unique to per-product unique
ALTER TABLE analytics_integrations DROP CONSTRAINT IF EXISTS analytics_integrations_organization_id_key;
ALTER TABLE analytics_integrations ADD CONSTRAINT analytics_integrations_product_unique UNIQUE (product_id);

-- ROI calculations: Change from per-org unique period to per-product unique period
ALTER TABLE roi_calculations DROP CONSTRAINT IF EXISTS roi_calculations_organization_id_period_start_period_end_key;
ALTER TABLE roi_calculations ADD CONSTRAINT roi_calculations_product_period_unique UNIQUE (product_id, period_start, period_end);

-- Monitored pages: Change from per-org unique URL to per-product unique URL
ALTER TABLE monitored_pages DROP CONSTRAINT IF EXISTS monitored_pages_organization_id_url_key;
ALTER TABLE monitored_pages ADD CONSTRAINT monitored_pages_product_url_unique UNIQUE (product_id, url);

-- AI traffic metrics: Change from per-org unique date/source to per-product unique
ALTER TABLE ai_traffic_metrics DROP CONSTRAINT IF EXISTS ai_traffic_metrics_organization_id_date_source_key;
ALTER TABLE ai_traffic_metrics ADD CONSTRAINT ai_traffic_metrics_product_date_source_unique UNIQUE (product_id, date, source);

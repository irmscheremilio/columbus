-- Add scan_session_id to prompt_results for grouping extension scan results
ALTER TABLE prompt_results
ADD COLUMN IF NOT EXISTS scan_session_id UUID;

-- Index for querying by scan session
CREATE INDEX IF NOT EXISTS idx_prompt_results_scan_session ON prompt_results(scan_session_id)
WHERE scan_session_id IS NOT NULL;

-- Create a view to aggregate scan session results for the visibility chart
CREATE OR REPLACE VIEW scan_session_stats AS
SELECT
  scan_session_id,
  organization_id,
  product_id,
  ai_model,
  MIN(tested_at) as started_at,
  MAX(tested_at) as completed_at,
  COUNT(*) as total_prompts,
  COUNT(*) FILTER (WHERE brand_mentioned = true) as mentioned_count,
  COUNT(*) FILTER (WHERE citation_present = true) as cited_count,
  ROUND(
    (COUNT(*) FILTER (WHERE brand_mentioned = true)::numeric / NULLIF(COUNT(*), 0)) * 100, 1
  ) as mention_rate,
  ROUND(
    (COUNT(*) FILTER (WHERE citation_present = true)::numeric / NULLIF(COUNT(*), 0)) * 100, 1
  ) as citation_rate,
  ROUND(AVG(position) FILTER (WHERE position IS NOT NULL), 1) as avg_position
FROM prompt_results
WHERE scan_session_id IS NOT NULL
GROUP BY scan_session_id, organization_id, product_id, ai_model;

-- Function to update visibility_history after a scan session completes
CREATE OR REPLACE FUNCTION update_visibility_history_from_session(
  p_scan_session_id UUID,
  p_organization_id UUID,
  p_product_id UUID
) RETURNS void AS $$
DECLARE
  v_platform RECORD;
BEGIN
  -- Calculate and upsert visibility history for each platform in this session
  FOR v_platform IN
    SELECT
      ai_model,
      mention_rate,
      citation_rate,
      total_prompts,
      mentioned_count,
      cited_count
    FROM scan_session_stats
    WHERE scan_session_id = p_scan_session_id
      AND organization_id = p_organization_id
      AND product_id = p_product_id
  LOOP
    -- Calculate visibility score: 40% mention rate + 30% citation rate + 30% base
    INSERT INTO visibility_history (
      organization_id,
      product_id,
      ai_model,
      score,
      mention_rate,
      citation_rate,
      prompts_tested,
      prompts_mentioned,
      prompts_cited,
      recorded_at
    ) VALUES (
      p_organization_id,
      p_product_id,
      v_platform.ai_model,
      ROUND((COALESCE(v_platform.mention_rate, 0) * 0.4 + COALESCE(v_platform.citation_rate, 0) * 0.3 + 30)::numeric, 1),
      COALESCE(v_platform.mention_rate, 0),
      COALESCE(v_platform.citation_rate, 0),
      v_platform.total_prompts,
      v_platform.mentioned_count,
      v_platform.cited_count,
      NOW()
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

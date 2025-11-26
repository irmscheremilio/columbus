-- Migration: Enforce product limit at database level
-- This is a safety net to prevent exceeding product limits even if edge function checks fail

-- Create function to check product limit before insert
CREATE OR REPLACE FUNCTION check_product_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_current_count INTEGER;
  v_max_limit INTEGER;
BEGIN
  -- Count existing active products for this organization
  SELECT COUNT(*) INTO v_current_count
  FROM products
  WHERE organization_id = NEW.organization_id
    AND is_active = true;

  -- Get the organization's product limit
  SELECT COALESCE(product_limit, 1) INTO v_max_limit
  FROM organizations
  WHERE id = NEW.organization_id;

  -- Check if adding this product would exceed the limit
  IF v_current_count >= v_max_limit THEN
    RAISE EXCEPTION 'Product limit reached. Organization has %/% products allowed on current plan.', v_current_count, v_max_limit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce limit on insert
DROP TRIGGER IF EXISTS trigger_check_product_limit ON products;
CREATE TRIGGER trigger_check_product_limit
  BEFORE INSERT ON products
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION check_product_limit();

-- Also enforce on update (when reactivating a product)
DROP TRIGGER IF EXISTS trigger_check_product_limit_update ON products;
CREATE TRIGGER trigger_check_product_limit_update
  BEFORE UPDATE ON products
  FOR EACH ROW
  WHEN (OLD.is_active = false AND NEW.is_active = true)
  EXECUTE FUNCTION check_product_limit();

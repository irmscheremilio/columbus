# Plan: Products Architecture Migration

## Overview
Migrate from organization-centric domain model to a products-centric model where:
- Organizations no longer have a domain
- Products (replacing "brands") have domains and are the unit of analysis
- Plan limits enforce product counts: Free/Pro = 1 product, Agency = 5 products
- Signup flow simplified: create org immediately, ask if user wants free AEO audit, then collect product details

## Current State

### Database Schema
- `organizations`: has `domain`, `industry`, `tech_stack` columns
- `brands`: has `organization_id`, `name`, `website`, `is_active`
- Data entities (prompts, prompt_results, visibility_scores, etc.) all reference `organization_id`

### Signup Flow
1. User fills company name, website, description on signup page
2. After email confirmation, `callback.vue` creates organization with domain
3. Creates brand with same name/website
4. Triggers website analysis job

## Target State

### Database Changes

1. **Rename `brands` to `products`** with enhanced columns:
   - Add `domain` (extracted from website)
   - Add `industry`, `description`
   - Add analysis-related columns: `aeo_score`, `last_analyzed_at`
   - These become the primary analysis target

2. **Modify `organizations`**:
   - Remove `domain` column (products have domains now)
   - Remove `industry` (products have industries)
   - Remove `tech_stack` (product-specific)
   - Add `product_limit` column (1 for free/pro, 5 for agency)

3. **Add `product_id` foreign key** to data tables:
   - `prompts` - prompts are product-specific
   - `prompt_results` - results are product-specific
   - `visibility_scores` - scores are product-specific
   - `fix_recommendations` - recommendations are product-specific
   - `website_analyses` - analyses are product-specific
   - `product_analyses` - already exists, but verify structure
   - `crawled_pages` - pages are product-specific
   - `competitors` - competitors are product-specific (per product)
   - `jobs` - jobs reference products

4. **Plan limits enforcement**:
   - Create function `can_create_product(org_id)` that checks:
     - Current plan (free, pro, agency, enterprise)
     - Current product count
     - Returns boolean

### API/Edge Function Changes

1. **`setup-user` function**:
   - Remove: company name, website, description parameters
   - Just create organization with default name, no products
   - Return `{ organization, hasProducts: false }`

2. **New `create-product` function**:
   - Parameters: `name`, `website`, `description`, `industry`
   - Validates plan limits before creation
   - Creates product entry
   - Triggers website analysis for that product
   - Returns product details and job ID

3. **Update `trigger-website-analysis`**:
   - Accept `productId` instead of relying on organization domain
   - Look up product to get domain

4. **Update `trigger-scan`**:
   - Accept `productId` parameter
   - Filter prompts by product

### Worker Changes

1. **`website-analysis.ts`**:
   - Accept `productId` in job data
   - Store all data with both `organization_id` and `product_id`
   - Use product's domain for crawling

2. **`visibility-scanner.ts`**:
   - Accept `productId` in job data
   - Filter/store results by product

### Frontend Changes

1. **`signup.vue`**:
   - Remove company name, website, description fields
   - Just email + password (or OAuth)
   - Store nothing in user metadata except signup flag

2. **`callback.vue`**:
   - After auth, create organization immediately (no form)
   - Show "Welcome" screen with option:
     - "Get a Free AEO Audit" -> show product form
     - "Skip for now" -> go to dashboard
   - If user chooses audit:
     - Show product form (name, website, description)
     - Create product via edge function
     - Show analysis progress animation
     - Redirect to dashboard

3. **Dashboard pages**:
   - Add product selector in header/sidebar when org has multiple products
   - Store active product in state (similar to active organization)
   - Filter all data by selected product

4. **New "Products" management page**:
   - List all products
   - Add product button (with plan limit check)
   - Edit/delete products
   - Show analysis status per product

## Migration Steps

### Phase 1: Database Migration (031_products_architecture.sql)
```sql
-- 1. Rename brands to products
ALTER TABLE brands RENAME TO products;

-- 2. Add new columns to products
ALTER TABLE products
ADD COLUMN domain TEXT,
ADD COLUMN industry TEXT,
ADD COLUMN description TEXT,
ADD COLUMN aeo_score INTEGER,
ADD COLUMN last_analyzed_at TIMESTAMPTZ;

-- 3. Populate domain from website
UPDATE products
SET domain = regexp_replace(website, '^https?://([^/]+).*', '\1')
WHERE website IS NOT NULL;

-- 4. Add product_id to data tables
ALTER TABLE prompts ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE prompt_results ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE visibility_scores ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE fix_recommendations ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE website_analyses ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE crawled_pages ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE competitors ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE CASCADE;
ALTER TABLE jobs ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE CASCADE;

-- 5. Migrate existing data: link to first product of each org
UPDATE prompts p SET product_id = (
  SELECT id FROM products WHERE organization_id = p.organization_id AND is_active = true LIMIT 1
);
-- (Repeat for other tables)

-- 6. Add product limit to organizations
ALTER TABLE organizations
ADD COLUMN product_limit INTEGER DEFAULT 1;

-- 7. Update product limits based on plan
UPDATE organizations SET product_limit =
  CASE
    WHEN plan IN ('free', 'pro') THEN 1
    WHEN plan = 'agency' THEN 5
    WHEN plan = 'enterprise' THEN 100
    ELSE 1
  END;

-- 8. Create function to check product limit
CREATE OR REPLACE FUNCTION can_create_product(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  SELECT COUNT(*) INTO current_count
  FROM products
  WHERE organization_id = org_id AND is_active = true;

  SELECT product_limit INTO max_limit
  FROM organizations
  WHERE id = org_id;

  RETURN current_count < COALESCE(max_limit, 1);
END;
$$ LANGUAGE plpgsql;

-- 9. Remove domain from organizations (after data migration)
ALTER TABLE organizations DROP COLUMN IF EXISTS domain;
ALTER TABLE organizations DROP COLUMN IF EXISTS tech_stack;
-- Keep industry on org as optional org-wide setting
```

### Phase 2: Edge Functions
1. Update `setup-user/index.ts`
2. Create `create-product/index.ts`
3. Update `trigger-website-analysis/index.ts`
4. Update `trigger-scan/index.ts`

### Phase 3: Worker Updates
1. Update `website-analysis.ts`
2. Update `visibility-scanner.ts`
3. Update other job processors

### Phase 4: Frontend Updates
1. Update `signup.vue`
2. Rewrite `callback.vue`
3. Add product selector to dashboard
4. Create products management page
5. Update all dashboard pages to filter by product

### Phase 5: Pricing Page Update
- Update feature list to show "1 Product" for Free/Pro
- Show "Up to 5 Products" for Agency
- Explain product model in FAQ

## Files to Modify

### Database
- `supabase/migrations/031_products_architecture.sql` (new)

### Edge Functions
- `supabase/functions/setup-user/index.ts`
- `supabase/functions/create-product/index.ts` (new)
- `supabase/functions/trigger-website-analysis/index.ts`
- `supabase/functions/trigger-scan/index.ts`
- `supabase/functions/trigger-competitor-analysis/index.ts`

### Worker
- `worker/src/queue/website-analysis.ts`
- `worker/src/queue/visibility-scanner.ts`
- `worker/src/queue/competitor-analysis.ts`
- `worker/src/queue/scan-scheduler.ts`
- `worker/src/queue/freshness-checker.ts`

### Frontend
- `frontend/pages/auth/signup.vue`
- `frontend/pages/auth/callback.vue`
- `frontend/pages/dashboard/index.vue`
- `frontend/pages/dashboard/products/index.vue` (new)
- `frontend/pages/dashboard/visibility/index.vue`
- `frontend/pages/dashboard/recommendations/index.vue`
- `frontend/pages/dashboard/gaps/index.vue`
- `frontend/pages/dashboard/platforms.vue`
- `frontend/pages/dashboard/roi.vue`
- `frontend/composables/useActiveProduct.ts` (new)
- `frontend/components/ProductSelector.vue` (new)
- `frontend/pages/pricing.vue`

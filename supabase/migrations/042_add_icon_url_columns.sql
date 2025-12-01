-- Add icon_url column to products and competitors tables
-- Stores the favicon URL for display in the UI

-- Add icon_url to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- Add icon_url to competitors table
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN products.icon_url IS 'URL to the product/brand favicon';
COMMENT ON COLUMN competitors.icon_url IS 'URL to the competitor favicon';

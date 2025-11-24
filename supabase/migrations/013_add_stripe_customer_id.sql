-- Add Stripe customer ID to subscriptions table for billing portal access
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Create index for efficient customer lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id
ON subscriptions(stripe_customer_id);

-- Add comment
COMMENT ON COLUMN subscriptions.stripe_customer_id IS 'Stripe customer ID for billing portal access';

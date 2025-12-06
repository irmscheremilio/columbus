-- Add intent column to waitlist table to track which pricing tier the user clicked
ALTER TABLE waitlist
ADD COLUMN intent TEXT DEFAULT 'free' CHECK (intent IN ('free', 'pro', 'scaling'));

-- Add index for filtering by intent
CREATE INDEX idx_waitlist_intent ON waitlist(intent);

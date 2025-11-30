-- Add chat_url column to prompt_results for storing AI chat URLs from extension scans
ALTER TABLE prompt_results
ADD COLUMN IF NOT EXISTS chat_url TEXT;

-- Index for querying by chat_url
CREATE INDEX IF NOT EXISTS idx_prompt_results_chat_url ON prompt_results(chat_url)
WHERE chat_url IS NOT NULL;

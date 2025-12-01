-- Create AI platforms table to store platform metadata including logos
CREATE TABLE IF NOT EXISTS ai_platforms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  color TEXT,
  description TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default AI platforms with logo URLs
INSERT INTO ai_platforms (id, name, logo_url, color, description, website_url) VALUES
  ('chatgpt', 'ChatGPT', 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg', '#10a37f', 'OpenAI''s conversational AI assistant', 'https://chat.openai.com'),
  ('claude', 'Claude', 'https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg', '#d97757', 'Anthropic''s AI assistant focused on safety', 'https://claude.ai'),
  ('gemini', 'Gemini', 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg', '#4285f4', 'Google''s multimodal AI model', 'https://gemini.google.com'),
  ('perplexity', 'Perplexity', 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Perplexity_AI_logo.svg', '#20b8cd', 'AI-powered search and answer engine', 'https://perplexity.ai')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  logo_url = EXCLUDED.logo_url,
  color = EXCLUDED.color,
  description = EXCLUDED.description,
  website_url = EXCLUDED.website_url;

-- Allow public read access to ai_platforms
ALTER TABLE ai_platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ai_platforms"
  ON ai_platforms FOR SELECT
  USING (true);

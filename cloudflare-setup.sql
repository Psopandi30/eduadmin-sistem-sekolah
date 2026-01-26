-- =========================================
-- EduAdmin - Cloudflare Pages CORS Setup
-- Jalankan di Supabase SQL Editor
-- =========================================

-- 1. Setup CORS untuk Cloudflare Pages domain
-- Ganti YOUR-CLOUDFLARE-DOMAIN dengan domain actual Anda

INSERT INTO auth.config (key, value)
VALUES
  ('site_url', 'https://YOUR-CLOUDFLARE-DOMAIN.pages.dev'),
  ('additional_redirect_urls', '["https://YOUR-CLOUDFLARE-DOMAIN.pages.dev"]')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Enable RLS untuk semua AI tables
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_system_settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies untuk admin access (AI Management)
CREATE POLICY "Admin can manage AI providers" ON ai_providers
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage AI API keys" ON ai_api_keys
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage AI chat sessions" ON ai_chat_sessions
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage AI chat messages" ON ai_chat_messages
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin can manage AI system settings" ON ai_system_settings
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 4. Allow public read access untuk AI providers (untuk dropdown)
CREATE POLICY "Public can read AI providers" ON ai_providers
  FOR SELECT USING (true);

-- 5. Insert default AI providers
INSERT INTO ai_providers (name, provider_type, model_name, description) VALUES
  ('Google Gemini', 'gemini', 'gemini-1.5-flash', 'Google Gemini AI - Fast and reliable'),
  ('OpenAI GPT-4', 'openai', 'gpt-4', 'OpenAI GPT-4 - Most capable model'),
  ('Anthropic Claude', 'anthropic', 'claude-3-sonnet-20240229', 'Anthropic Claude - Safe and helpful'),
  ('Groq', 'groq', 'mixtral-8x7b-32768', 'Groq - Fast inference'),
  ('Socratic by Google', 'socratic', 'socratic-1', 'Educational AI by Google')
ON CONFLICT (name) DO NOTHING;

-- 6. Insert default system settings
INSERT INTO ai_system_settings (setting_key, setting_value, description) VALUES
  ('default_provider', 'gemini', 'Default AI provider for new chats'),
  ('max_tokens', '4096', 'Maximum tokens per request'),
  ('temperature', '0.7', 'AI creativity level (0-1)'),
  ('rate_limit_per_hour', '100', 'API calls per hour limit')
ON CONFLICT (setting_key) DO NOTHING;

-- 7. Verify setup
SELECT 'CORS and AI tables setup complete!' as status;
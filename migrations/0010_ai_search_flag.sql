-- Flag clicks that come from live AI searches or assistant fetches (for
-- example ChatGPT-User, Perplexity-User, Claude-User). These are triggered
-- when a person asks an AI tool, or an agent acting for them, to look up a
-- link, distinct from the AI training crawlers captured by is_bot. The flag
-- lets analytics views exclude them at query time while keeping the raw click
-- and its User-Agent intact. Filtering decisions live in the query layer.
ALTER TABLE clicks ADD COLUMN is_ai_search INTEGER DEFAULT 0;

CREATE INDEX idx_clicks_is_ai_search ON clicks(is_ai_search);

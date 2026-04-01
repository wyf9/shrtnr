-- Add created_via column to track how each link was created.
-- Values: 'app', 'api', 'sdk', 'mcp'. Pre-existing links default to 'app'.
ALTER TABLE links ADD COLUMN created_via TEXT DEFAULT 'app';

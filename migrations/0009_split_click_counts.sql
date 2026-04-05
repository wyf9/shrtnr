-- Split click_count into link_click_count and qr_click_count.
-- Existing click_count values are assumed to be direct (link) clicks.
ALTER TABLE slugs ADD COLUMN link_click_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE slugs ADD COLUMN qr_click_count INTEGER NOT NULL DEFAULT 0;
UPDATE slugs SET link_click_count = click_count;

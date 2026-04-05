-- Add is_primary flag to mark display slug and disabled_at for soft-disabling slugs
ALTER TABLE slugs ADD COLUMN is_primary INTEGER NOT NULL DEFAULT 0;
ALTER TABLE slugs ADD COLUMN disabled_at INTEGER;

-- Set existing random slugs (is_vanity=0) as primary for each link
-- that has no vanity slug. For links with a vanity slug, set the vanity as primary.
UPDATE slugs SET is_primary = 1
WHERE id IN (
  SELECT MIN(s.id) FROM slugs s
  LEFT JOIN slugs v ON v.link_id = s.link_id AND v.is_vanity = 1
  WHERE v.id IS NULL AND s.is_vanity = 0
  GROUP BY s.link_id
);

UPDATE slugs SET is_primary = 1
WHERE id IN (
  SELECT MIN(s.id) FROM slugs s
  WHERE s.is_vanity = 1
  GROUP BY s.link_id
);

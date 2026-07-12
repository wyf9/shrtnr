-- Remove the bundles feature.
--
-- Bundles (user-owned collections of links with combined stats) were dropped
-- from the product. This migration removes the schema introduced in
-- 0005_bundles.sql. The unrelated visitor_fp column added by that same
-- migration is intentionally left in place.
--
-- bundle_links is dropped first because it references bundles(id).

DROP INDEX IF EXISTS idx_bundle_links_link_id;
DROP TABLE IF EXISTS bundle_links;

DROP INDEX IF EXISTS idx_bundles_created_by;
DROP INDEX IF EXISTS idx_bundles_archived_at;
DROP TABLE IF EXISTS bundles;

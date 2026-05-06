-- Add redirect settings (root redirect URL and dynamic redirect rules)

INSERT OR IGNORE INTO settings (identity, key, value) VALUES ('anonymous', 'root_redirect_url', '');
INSERT OR IGNORE INTO settings (identity, key, value) VALUES ('anonymous', 'dynamic_redirect_rules', '');

-- Per-user preferences (theme, etc.)

CREATE TABLE user_preferences (
  email TEXT NOT NULL,
  key   TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (email, key)
);

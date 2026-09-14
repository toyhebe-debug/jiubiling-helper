CREATE TABLE IF NOT EXISTS family_state (id TEXT PRIMARY KEY NOT NULL, body TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL, last_operation TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS family_auth (id TEXT PRIMARY KEY NOT NULL, password_hash TEXT NOT NULL, salt TEXT NOT NULL, iterations INTEGER NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS family_sessions (token_hash TEXT PRIMARY KEY NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS idx_family_sessions_expiry ON family_sessions(expires_at);
CREATE TABLE IF NOT EXISTS auth_limits (bucket TEXT PRIMARY KEY NOT NULL, hits INTEGER NOT NULL, expires_at INTEGER NOT NULL);

CREATE TABLE presence_sessions (
  visitor_id TEXT NOT NULL,
  tab_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (visitor_id, tab_id)
);
--> statement-breakpoint
CREATE INDEX presence_sessions_expiry ON presence_sessions (expires_at);
--> statement-breakpoint
CREATE TABLE presence_limits (
  key TEXT PRIMARY KEY NOT NULL,
  hits INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX presence_limits_expiry ON presence_limits (expires_at);

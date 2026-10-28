CREATE TABLE IF NOT EXISTS calendar_events (
 id TEXT PRIMARY KEY, space_id TEXT REFERENCES spaces(id) ON DELETE SET NULL,
 title TEXT NOT NULL, datetime TEXT NOT NULL, end_datetime TEXT NOT NULL,
 description TEXT NOT NULL DEFAULT '', participants TEXT NOT NULL DEFAULT '',
 location TEXT NOT NULL DEFAULT '', link TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'Programada' CHECK(status IN ('Programada','Realizada','Cancelada')),
 created_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 0 CHECK(revision>=0)
);
CREATE INDEX IF NOT EXISTS idx_calendar_events_datetime ON calendar_events(datetime);
INSERT OR IGNORE INTO team_config VALUES ('calendar_schema_v1','1');

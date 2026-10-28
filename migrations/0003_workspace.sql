CREATE TABLE IF NOT EXISTS space_details (
 space_id TEXT PRIMARY KEY REFERENCES spaces(id) ON DELETE CASCADE,
 email TEXT NOT NULL DEFAULT '', extension TEXT NOT NULL DEFAULT '',
 office TEXT NOT NULL DEFAULT '', entity TEXT NOT NULL DEFAULT '', location TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS task_details (
 task_id TEXT PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
 stage TEXT NOT NULL DEFAULT 'Por hacer' CHECK(stage IN ('Por hacer','En proceso','En revisión','Completado')),
 source_text TEXT NOT NULL DEFAULT '', source_type TEXT NOT NULL DEFAULT 'Texto',
 due_datetime TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS meeting_details (
 meeting_id TEXT PRIMARY KEY REFERENCES meetings(id) ON DELETE CASCADE,
 location TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'Programada'
 CHECK(status IN ('Programada','Realizada','Cancelada')),
 agreement_items TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(agreement_items))
);
CREATE TABLE IF NOT EXISTS notifications (
 id TEXT PRIMARY KEY, sender TEXT NOT NULL, recipient TEXT NOT NULL,
 space_id TEXT REFERENCES spaces(id) ON DELETE SET NULL,
 contact_name TEXT NOT NULL DEFAULT '', cut_code TEXT NOT NULL DEFAULT '',
 content TEXT NOT NULL, created_at TEXT NOT NULL,
 read_at TEXT NOT NULL DEFAULT '', acknowledged_at TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient,created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_sender ON notifications(sender,created_at);
CREATE TABLE IF NOT EXISTS agreement_tasks (
 meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
 agreement_index INTEGER NOT NULL, task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
 PRIMARY KEY(meeting_id,agreement_index)
);
INSERT OR IGNORE INTO team_config (config_key,config_value) VALUES ('workspace_schema_v2','1');

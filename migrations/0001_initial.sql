PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS spaces (
 id TEXT PRIMARY KEY, phone_or_group_id TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
 role TEXT NOT NULL DEFAULT '', org_unit TEXT NOT NULL DEFAULT 'ALA', cut_code TEXT NOT NULL DEFAULT '',
 doc_ref TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'Pendiente'
 CHECK(status IN ('Urgente','Pendiente','En elaboración','Para V°B°','Cerrado')),
 assignees TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(assignees)), last_message TEXT NOT NULL DEFAULT '',
 updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS notes (
 id TEXT PRIMARY KEY, space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
 author TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tasks (
 id TEXT PRIMARY KEY, space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
 title TEXT NOT NULL, assignee TEXT NOT NULL, due_date TEXT NOT NULL DEFAULT '',
 done INTEGER NOT NULL DEFAULT 0 CHECK(done IN (0,1)), created_by TEXT NOT NULL,
 created_at TEXT NOT NULL, updated_by TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS meetings (
 id TEXT PRIMARY KEY, space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
 title TEXT NOT NULL, datetime TEXT NOT NULL, link TEXT NOT NULL DEFAULT '', participants TEXT NOT NULL DEFAULT '',
 agreements TEXT NOT NULL DEFAULT '', created_by TEXT NOT NULL, created_at TEXT NOT NULL, updated_by TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS templates (
 id TEXT PRIMARY KEY, command TEXT NOT NULL UNIQUE, title TEXT NOT NULL, content TEXT NOT NULL,
 created_by TEXT NOT NULL, updated_by TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS presence (
 pc_id TEXT PRIMARY KEY, device_id TEXT NOT NULL, space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
 operator_name TEXT NOT NULL, last_seen INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS team_config (config_key TEXT PRIMARY KEY, config_value TEXT NOT NULL CHECK(json_valid(config_value)));
INSERT OR IGNORE INTO team_config VALUES ('members','["Marco","Lucía","Diego","Carla"]');
CREATE INDEX IF NOT EXISTS idx_notes_space ON notes(space_id,created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_space ON tasks(space_id,done,due_date);
CREATE INDEX IF NOT EXISTS idx_meetings_space ON meetings(space_id,datetime);
CREATE INDEX IF NOT EXISTS idx_spaces_status ON spaces(status,updated_at);
CREATE INDEX IF NOT EXISTS idx_presence_seen ON presence(last_seen,space_id);

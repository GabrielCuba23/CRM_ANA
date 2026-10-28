export const WORKSPACE_SCHEMA_SQL = [
  "CREATE TABLE IF NOT EXISTS space_details (\n space_id TEXT PRIMARY KEY REFERENCES spaces(id) ON DELETE CASCADE,\n email TEXT NOT NULL DEFAULT '', extension TEXT NOT NULL DEFAULT '',\n office TEXT NOT NULL DEFAULT '', entity TEXT NOT NULL DEFAULT '', location TEXT NOT NULL DEFAULT ''\n)",
  "CREATE TABLE IF NOT EXISTS task_details (\n task_id TEXT PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,\n stage TEXT NOT NULL DEFAULT 'Por hacer' CHECK(stage IN ('Por hacer','En proceso','En revisión','Completado')),\n source_text TEXT NOT NULL DEFAULT '', source_type TEXT NOT NULL DEFAULT 'Texto',\n due_datetime TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT ''\n)",
  "CREATE TABLE IF NOT EXISTS meeting_details (\n meeting_id TEXT PRIMARY KEY REFERENCES meetings(id) ON DELETE CASCADE,\n location TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'Programada'\n CHECK(status IN ('Programada','Realizada','Cancelada')),\n agreement_items TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(agreement_items))\n)",
  "CREATE TABLE IF NOT EXISTS notifications (\n id TEXT PRIMARY KEY, sender TEXT NOT NULL, recipient TEXT NOT NULL,\n space_id TEXT REFERENCES spaces(id) ON DELETE SET NULL,\n contact_name TEXT NOT NULL DEFAULT '', cut_code TEXT NOT NULL DEFAULT '',\n content TEXT NOT NULL, created_at TEXT NOT NULL,\n read_at TEXT NOT NULL DEFAULT '', acknowledged_at TEXT NOT NULL DEFAULT ''\n)",
  "CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient,created_at)",
  "CREATE INDEX IF NOT EXISTS idx_notifications_sender ON notifications(sender,created_at)",
  "CREATE TABLE IF NOT EXISTS agreement_tasks (\n meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,\n agreement_index INTEGER NOT NULL, task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,\n PRIMARY KEY(meeting_id,agreement_index)\n)"
];
export const WORKSPACE_SCHEMA_MARKER = "INSERT OR IGNORE INTO team_config (config_key,config_value) VALUES ('workspace_schema_v2','1')";
export async function ensureWorkspaceSchema(db) {
 const row=await db.prepare("SELECT config_key FROM team_config WHERE config_key='workspace_schema_v2'").first();
 if(row)return;
 await db.batch([...WORKSPACE_SCHEMA_SQL.map(sql=>db.prepare(sql)),db.prepare(WORKSPACE_SCHEMA_MARKER)]);
}
export function spaceDetailsStatement(db,s) {
 return db.prepare(`INSERT INTO space_details (space_id,email,extension,office,entity,location) SELECT ?,?,?,?,?,? WHERE changes()>0
 ON CONFLICT(space_id) DO UPDATE SET email=excluded.email,extension=excluded.extension,office=excluded.office,entity=excluded.entity,location=excluded.location`)
 .bind(s.id,s.email,s.extension,s.office,s.entity,s.location);
}
export function taskDetailsStatement(db,t,now) {
 return db.prepare(`INSERT INTO task_details (task_id,stage,source_text,source_type,due_datetime,updated_at) SELECT ?,?,?,?,?,? WHERE changes()>0
 ON CONFLICT(task_id) DO UPDATE SET stage=excluded.stage,source_text=excluded.source_text,source_type=excluded.source_type,due_datetime=excluded.due_datetime,updated_at=excluded.updated_at`)
 .bind(t.id,t.stage,t.source_text,t.source_type,t.due_datetime,now);
}
export function meetingDetailsStatement(db,m) {
 return db.prepare(`INSERT INTO meeting_details (meeting_id,location,status,agreement_items) SELECT ?,?,?,? WHERE changes()>0
 ON CONFLICT(meeting_id) DO UPDATE SET location=excluded.location,status=excluded.status,agreement_items=excluded.agreement_items`)
 .bind(m.id,m.location,m.status,JSON.stringify(m.agreement_items));
}
export function restoreDetailsStatements(db,d) {
 const queries=[
  ["INSERT INTO space_details SELECT json_extract(value,'$.id'),json_extract(value,'$.email'),json_extract(value,'$.extension'),json_extract(value,'$.office'),json_extract(value,'$.entity'),json_extract(value,'$.location') FROM json_each(?)",d.spaces],
  ["INSERT INTO task_details SELECT json_extract(value,'$.id'),json_extract(value,'$.stage'),json_extract(value,'$.source_text'),json_extract(value,'$.source_type'),json_extract(value,'$.due_datetime'),json_extract(value,'$.updated_at') FROM json_each(?)",d.tasks],
  ["INSERT INTO meeting_details SELECT json_extract(value,'$.id'),json_extract(value,'$.location'),json_extract(value,'$.status'),json_extract(value,'$.agreement_items') FROM json_each(?)",d.meetings],
  ["INSERT INTO notifications SELECT json_extract(value,'$.id'),json_extract(value,'$.sender'),json_extract(value,'$.recipient'),json_extract(value,'$.space_id'),json_extract(value,'$.contact_name'),json_extract(value,'$.cut_code'),json_extract(value,'$.content'),json_extract(value,'$.created_at'),json_extract(value,'$.read_at'),json_extract(value,'$.acknowledged_at') FROM json_each(?)",d.notifications],
  ["INSERT INTO agreement_tasks SELECT json_extract(value,'$.meeting_id'),json_extract(value,'$.agreement_index'),json_extract(value,'$.task_id') FROM json_each(?)",d.agreement_tasks]
 ];
 return queries.map(([sql,rows])=>db.prepare(sql).bind(JSON.stringify(rows)));
}

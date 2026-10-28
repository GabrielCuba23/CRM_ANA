import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {ensureWorkspaceSchema} from '../server/workspace.js';
test('la actualización automática crea tablas adicionales sin perder datos anteriores y se puede repetir',async()=>{
 const sql=new DatabaseSync(':memory:');
 sql.exec(readFileSync(new URL('../migrations/0001_initial.sql',import.meta.url),'utf8'));
 sql.exec("INSERT INTO spaces (id,phone_or_group_id,name,updated_at) VALUES ('s1','51999999999','Contacto anterior','2026-10-27T15:00:00.000Z')");
 const db={prepare(statement){return {statement,values:[],bind(...values){return {...this,values};},async first(){return sql.prepare(this.statement).get(...this.values)||null;}};},async batch(statements){sql.exec('BEGIN');try{for(const s of statements)sql.prepare(s.statement).run(...s.values);sql.exec('COMMIT');}catch(e){sql.exec('ROLLBACK');throw e;}}};
 try{
  await Promise.all([ensureWorkspaceSchema(db),ensureWorkspaceSchema(db)]);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM spaces').get().n,1);
  for(const table of ['space_details','task_details','meeting_details','notifications','agreement_tasks'])assert.ok(sql.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table));
  sql.prepare("INSERT INTO notifications (id,sender,recipient,content,created_at) VALUES ('n1','Acxel','Jaruska','Aviso conservado','2026-10-27T15:00:00.000Z')").run();
  await ensureWorkspaceSchema(db);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM notifications').get().n,1);
 }finally{sql.close();}
});

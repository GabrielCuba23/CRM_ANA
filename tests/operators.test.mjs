import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {ensureInitialOperators,TEAM_ROSTER_VERSION_KEY} from '../server/team.js';

const expected=['Hanz','Fernando','Acxel','Andrés','Shirley','Jaruska','Marco','Alejandra','Marcelo','Luciano','Sheila','Cristina'];
function fixture(){
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/0001_initial.sql',import.meta.url),'utf8'));
  const db={
    prepare(sql){return {sql,values:[],bind(...values){return {...this,values};},async first(){return sqlite.prepare(this.sql).get(...this.values)||null;}};},
    async batch(statements){sqlite.exec('BEGIN');try{for(const s of statements)sqlite.prepare(s.sql).run(...s.values);sqlite.exec('COMMIT');}catch(e){sqlite.exec('ROLLBACK');throw e;}}
  };
  const roster=()=>JSON.parse(sqlite.prepare("SELECT config_value FROM team_config WHERE config_key='members'").get().config_value);
  const setRoster=names=>sqlite.prepare("UPDATE team_config SET config_value=? WHERE config_key='members'").run(JSON.stringify(names));
  return {sqlite,db,roster,setRoster};
}
test('actualiza una base existente con los doce operadores y respeta altas y bajas posteriores',async()=>{
 const f=fixture();try{
  await ensureInitialOperators(f.db);assert.deepEqual(f.roster(),expected);
  f.setRoster(['Acxel','Nueva operadora']);await ensureInitialOperators(f.db);
  assert.deepEqual(f.roster(),['Acxel','Nueva operadora']);
  assert.equal(f.sqlite.prepare('SELECT config_value FROM team_config WHERE config_key=?').get(TEAM_ROSTER_VERSION_KEY).config_value,'1');
 }finally{f.sqlite.close();}
});
test('conserva operadores personalizados, asignaciones activas e historial al migrar',async()=>{
 const f=fixture();try{
  f.setRoster(['Marco','Lucía','Diego','Carla','Inés']);
  f.sqlite.prepare("INSERT INTO spaces (id,phone_or_group_id,name,assignees,updated_at) VALUES ('s1','51999999999','Coordinación existente',?,?)").run('["Lucía"]','2026-10-27T15:00:00.000Z');
  f.sqlite.prepare("INSERT INTO tasks (id,space_id,title,assignee,created_by,created_at,updated_by) VALUES ('t1','s1','Gestión pendiente','Diego','Carla',?,'Carla')").run('2026-10-27T15:00:00.000Z');
  f.sqlite.prepare("INSERT INTO notes VALUES ('n1','s1','Carla','Nota histórica',?)").run('2026-10-27T15:00:00.000Z');
  await ensureInitialOperators(f.db);
  assert.deepEqual(f.roster(),[...expected,'Lucía','Diego','Inés']);
  assert.equal(f.sqlite.prepare("SELECT author FROM notes WHERE id='n1'").get().author,'Carla');
  assert.equal(f.sqlite.prepare("SELECT assignee FROM tasks WHERE id='t1'").get().assignee,'Diego');
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM spaces').get().n,1);
 }finally{f.sqlite.close();}
});

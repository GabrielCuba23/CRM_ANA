import {reportTables} from '../shared/domain.js';
import {HttpError,assert,text,id,members,space,task,meeting,template,validateBackup,columns} from './validation.js';
const MAX_BYTES=1500000;
const TTL=15000;
function headers(request,env){
 const origin=request.headers.get('Origin');
 const allowed=new Set([new URL(request.url).origin,...(env.ALLOWED_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean)]);
 const h={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','Pragma':'no-cache','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','Vary':'Origin'};
 if(origin&&(allowed.has(origin)||/^chrome-extension:\/\/[a-p]{32}$/.test(origin))){h['Access-Control-Allow-Origin']=origin;h['Access-Control-Allow-Methods']='GET, POST, OPTIONS';h['Access-Control-Allow-Headers']='Content-Type, X-Team-Token';h['Access-Control-Max-Age']='600';}
 return h;
}
async function authenticate(request,env,path){
 assert(typeof env.TEAM_TOKEN==='string'&&env.TEAM_TOKEN.length>=24,'Configura TEAM_TOKEN con al menos 24 caracteres en Cloudflare',503);
 const supplied=request.headers.get('X-Team-Token') || (path==='powerbi'?new URL(request.url).searchParams.get('token'):'');
 assert(supplied&&supplied.length<=1024,'No autorizado',401);
 const encoder=new TextEncoder();
 const [a,b]=await Promise.all([supplied,env.TEAM_TOKEN].map(x=>crypto.subtle.digest('SHA-256',encoder.encode(x))));
 let diff=0;const aa=new Uint8Array(a),bb=new Uint8Array(b);for(let i=0;i<aa.length;i++)diff|=aa[i]^bb[i];
 assert(diff===0,'Token de equipo inválido',401);
 assert(env.DB,'Falta el binding DB de Cloudflare D1',503);
}
async function jsonBody(request){
 assert(request.headers.get('Content-Type')?.includes('application/json'),'Se requiere application/json',415);
 assert(Number(request.headers.get('Content-Length')||0)<=MAX_BYTES,'El archivo supera 1,5 MB',413);
 const reader=request.body?.getReader();assert(reader,'Cuerpo vacío');let size=0;const chunks=[];
 while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES){await reader.cancel();throw new HttpError(413,'El archivo supera 1,5 MB');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 try {const obj=JSON.parse(new TextDecoder().decode(bytes));assert(obj&&typeof obj==='object'&&!Array.isArray(obj),'JSON inválido');return obj;}catch(e){if(e instanceof HttpError)throw e;throw new HttpError(400,'JSON inválido');}
}
async function readState(db){
 const results=await db.batch([
 db.prepare('SELECT * FROM spaces ORDER BY updated_at DESC'),db.prepare('SELECT * FROM notes ORDER BY created_at DESC'),
 db.prepare('SELECT * FROM tasks ORDER BY created_at DESC'),db.prepare('SELECT * FROM meetings ORDER BY datetime ASC'),
 db.prepare('SELECT * FROM templates ORDER BY command'),db.prepare("SELECT config_value FROM team_config WHERE config_key='members'")]);
 return {spaces:results[0].results.map(s=>({...s,assignees:JSON.parse(s.assignees)})),notes:results[1].results,tasks:results[2].results.map(t=>({...t,done:!!t.done})),meetings:results[3].results,templates:results[4].results,members:JSON.parse(results[5].results[0]?.config_value||'[]')};
}
async function actor(db,name){
 const value=text(name,'Operador activo',80,true);
 const row=await db.prepare("SELECT config_value FROM team_config WHERE config_key='members'").first();
 assert(JSON.parse(row?.config_value||'[]').includes(value),'Selecciona un integrante activo del equipo',403);return value;
}
async function presence(db,spaceId){return (await db.prepare('SELECT * FROM presence WHERE space_id=? AND last_seen>=?').bind(spaceId,Date.now()-TTL).all()).results;}
async function requireSpace(db,spaceId){assert(await db.prepare('SELECT id FROM spaces WHERE id=?').bind(spaceId).first(),'El espacio ya no existe',404);}
async function writeAction(db,body){
 const operator=await actor(db,body.operator_name);
 const p=body.payload;assert(p&&typeof p==='object'&&!Array.isArray(p),'Payload inválido');
 const now=new Date().toISOString();let statement;
 switch(body.action){
 case 'UPSERT_SPACE': {
  const s=space(p);
  const team=await db.prepare("SELECT config_value FROM team_config WHERE config_key='members'").first();
  assert(s.assignees.every(a=>JSON.parse(team.config_value).includes(a)),'Responsable fuera del equipo');
  const result=await db.prepare(`INSERT INTO spaces (${columns.spaces.join(',')}) VALUES (?,?,?,?,?,?,?,?,?,?,?)
   ON CONFLICT(id) DO UPDATE SET phone_or_group_id=excluded.phone_or_group_id,name=excluded.name,role=excluded.role,org_unit=excluded.org_unit,cut_code=excluded.cut_code,doc_ref=excluded.doc_ref,status=excluded.status,assignees=excluded.assignees,last_message=excluded.last_message,updated_at=excluded.updated_at WHERE spaces.updated_at=?`).bind(s.id,s.phone_or_group_id,s.name,s.role,s.org_unit,s.cut_code,s.doc_ref,s.status,JSON.stringify(s.assignees),s.last_message,now,s.updated_at).run();
  assert(result.meta.changes>0,'Otra PC modificó este espacio. Actualiza y vuelve a editar.',409);return;
 }
 case 'DELETE_SPACE':statement=db.prepare('DELETE FROM spaces WHERE id=?').bind(id(p.id));break;
 case 'ADD_NOTE': {
  await requireSpace(db,id(p.space_id));
  await db.batch([db.prepare('INSERT INTO notes (id,space_id,author,content,created_at) VALUES (?,?,?,?,?)').bind(id(p.id),p.space_id,operator,text(p.content,'Nota',20000,true),now),db.prepare('UPDATE spaces SET updated_at=? WHERE id=?').bind(now,p.space_id)]);return;
 }
 case 'UPSERT_TASK': {
  const t=task(p);await requireSpace(db,t.space_id);
  const team=await db.prepare("SELECT config_value FROM team_config WHERE config_key='members'").first();
  assert(JSON.parse(team.config_value).includes(t.assignee),'Responsable fuera del equipo');
  statement=db.prepare(`INSERT INTO tasks (id,space_id,title,assignee,due_date,done,created_by,created_at,updated_by) VALUES (?,?,?,?,?,?,?,?,?)
   ON CONFLICT(id) DO UPDATE SET title=excluded.title,assignee=excluded.assignee,due_date=excluded.due_date,done=excluded.done,updated_by=excluded.updated_by WHERE tasks.space_id=excluded.space_id`).bind(t.id,t.space_id,t.title,t.assignee,t.due_date,t.done?1:0,operator,now,operator);break;
 }
 case 'DELETE_TASK':statement=db.prepare('DELETE FROM tasks WHERE id=?').bind(id(p.id));break;
 case 'ADD_MEETING': {
  const m=meeting(p);await requireSpace(db,m.space_id);
  statement=db.prepare(`INSERT INTO meetings (id,space_id,title,datetime,link,participants,agreements,created_by,created_at,updated_by) VALUES (?,?,?,?,?,?,?,?,?,?)
   ON CONFLICT(id) DO UPDATE SET title=excluded.title,datetime=excluded.datetime,link=excluded.link,participants=excluded.participants,agreements=excluded.agreements,updated_by=excluded.updated_by WHERE meetings.space_id=excluded.space_id`).bind(m.id,m.space_id,m.title,m.datetime,m.link,m.participants,m.agreements,operator,now,operator);break;
 }
 case 'DELETE_MEETING':statement=db.prepare('DELETE FROM meetings WHERE id=?').bind(id(p.id));break;
 case 'UPSERT_TEMPLATE': {
  const t=template(p);statement=db.prepare(`INSERT INTO templates (id,command,title,content,created_by,updated_by) VALUES (?,?,?,?,?,?)
   ON CONFLICT(id) DO UPDATE SET command=excluded.command,title=excluded.title,content=excluded.content,updated_by=excluded.updated_by`).bind(t.id,t.command,t.title,t.content,operator,operator);break;
 }
 case 'DELETE_TEMPLATE':statement=db.prepare('DELETE FROM templates WHERE id=?').bind(id(p.id));break;
 case 'UPDATE_MEMBERS': {
  const next=members(p.members);
  const all=await db.prepare('SELECT assignees FROM spaces').all();
  const tasks=await db.prepare('SELECT DISTINCT assignee FROM tasks WHERE done=0').all();
  const assigned=new Set([...all.results.flatMap(s=>JSON.parse(s.assignees)),...tasks.results.map(t=>t.assignee)]);
  const removed=[...assigned].filter(x=>!next.includes(x));
  assert(!removed.length,`Reasigna primero los espacios y tareas pendientes de: ${removed.join(', ')}`);
  statement=db.prepare("INSERT INTO team_config VALUES ('members',?) ON CONFLICT(config_key) DO UPDATE SET config_value=excluded.config_value").bind(JSON.stringify(next));break;
 }
 default:throw new HttpError(400,'Acción desconocida');
 }
 await statement.run();
}
async function restore(db,backup){
 const d=validateBackup(backup);
 const statements=['notes','tasks','meetings','presence','spaces','templates','team_config'].map(table=>db.prepare(`DELETE FROM ${table}`));
 for(const table of Object.keys(columns)){
  const rows=d[table].map(row=>({...row,...(table==='tasks'?{done:row.done?1:0}:{})}));
  const names=columns[table];
  statements.push(db.prepare(`INSERT INTO ${table} (${names.join(',')}) SELECT ${names.map(k=>`json_extract(value,'$.${k}')`).join(',')} FROM json_each(?)`).bind(JSON.stringify(rows)));
 }
 statements.push(db.prepare("INSERT INTO team_config VALUES ('members',?)").bind(JSON.stringify(d.members)));
 await db.batch(statements);
 return Object.fromEntries(Object.keys(columns).map(t=>[t,d[t].length]));
}
export async function onRequest({request,env}){
 const h=headers(request,env);const send=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:h});
 try{
  const path=new URL(request.url).pathname.replace(/^\/api\/?/,'').replace(/\/$/,'');
  assert(['sync','presence','backup','powerbi'].includes(path),'Ruta no encontrada',404);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:h});
  await authenticate(request,env,path);
  if(request.method==='GET'){
   if(path==='presence')return send({presence:await presence(env.DB,id(new URL(request.url).searchParams.get('space_id')))});
   const data=await readState(env.DB);
   if(path==='backup')return send({app:'crm-ana',schema_version:1,exported_at:new Date().toISOString(),data});
   if(path==='powerbi'){
    const tables=reportTables(data);
    return send({generated_at:new Date().toISOString(),Resumen_KPIs:tables['1_Resumen_KPIs'],Agenda_Espacios:tables['2_Agenda_Espacios'],Tareas_y_CUTs:tables['3_Tareas_y_CUTs'],Bitacora_Historica:tables['4_Bitacora_Historica'],Reuniones_Acuerdos:tables['5_Reuniones_Acuerdos']});
   }
   return send(data);
  }
  assert(request.method==='POST','Método no permitido',405);
  assert(path!=='powerbi','Método no permitido',405);
  const body=await jsonBody(request);
  if(path==='backup'){
   assert(body.confirm==='RESTAURAR','Confirma la restauración');await actor(env.DB,body.operator_name);
   return send({restored:true,counts:await restore(env.DB,body.backup)});
  }
  if(path==='presence'){
   const name=await actor(env.DB,body.operator_name);const pc=id(body.pc_id),device=id(body.device_id);
   if(body.leave){await env.DB.prepare('DELETE FROM presence WHERE pc_id=? AND space_id=? AND operator_name=?').bind(pc,id(body.space_id),name).run();return send({ok:true,presence:[]});}
   const spaceId=id(body.space_id);await requireSpace(env.DB,spaceId);
   await env.DB.batch([env.DB.prepare('DELETE FROM presence WHERE last_seen<?').bind(Date.now()-TTL),
    env.DB.prepare('INSERT INTO presence (pc_id,device_id,space_id,operator_name,last_seen) VALUES (?,?,?,?,?) ON CONFLICT(pc_id) DO UPDATE SET device_id=excluded.device_id,space_id=excluded.space_id,operator_name=excluded.operator_name,last_seen=excluded.last_seen').bind(pc,device,spaceId,name,Date.now())]);
   return send({ok:true,presence:await presence(env.DB,spaceId)});
  }
  await writeAction(env.DB,body);return send({ok:true});
 }catch(error){
  if(error instanceof HttpError)return send({error:error.message},error.status);
  if(/UNIQUE constraint/.test(error.message))return send({error:'Ya existe ese teléfono, ID o comando. Actualiza los datos.'},409);
  if(/FOREIGN KEY constraint/.test(error.message))return send({error:'El espacio asociado ya no existe'},409);
  console.error('API error:',error.name);
  return send({error:'No se pudo completar la operación. Revisa las migraciones y el binding DB.'},500);
 }
}

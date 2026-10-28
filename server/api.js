import {ensureWorkspaceSchema,spaceDetailsStatement,taskDetailsStatement,meetingDetailsStatement,restoreDetailsStatements} from './workspace.js';
import {ensureInitialOperators,TEAM_ROSTER_VERSION_KEY} from './team.js';
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
 db.prepare("SELECT spaces.*,COALESCE(d.email,'') AS email,COALESCE(d.extension,'') AS extension,COALESCE(d.office,'') AS office,COALESCE(d.entity,'') AS entity,COALESCE(d.location,'') AS location FROM spaces LEFT JOIN space_details d ON d.space_id=spaces.id ORDER BY updated_at DESC"),db.prepare('SELECT * FROM notes ORDER BY created_at DESC'),
 db.prepare("SELECT tasks.*,COALESCE(d.stage,CASE WHEN tasks.done=1 THEN 'Completado' ELSE 'Por hacer' END) AS stage,COALESCE(d.source_text,'') AS source_text,COALESCE(d.source_type,'Texto') AS source_type,COALESCE(d.due_datetime,'') AS due_datetime,COALESCE(d.updated_at,tasks.created_at) AS updated_at FROM tasks LEFT JOIN task_details d ON d.task_id=tasks.id ORDER BY created_at DESC"),db.prepare("SELECT meetings.*,COALESCE(d.location,'') AS location,COALESCE(d.status,'Programada') AS status,COALESCE(d.agreement_items,'[]') AS agreement_items FROM meetings LEFT JOIN meeting_details d ON d.meeting_id=meetings.id ORDER BY datetime ASC"),
 db.prepare('SELECT * FROM templates ORDER BY command'),db.prepare("SELECT config_value FROM team_config WHERE config_key='members'"),db.prepare('SELECT * FROM notifications ORDER BY created_at DESC'),db.prepare('SELECT * FROM agreement_tasks')]);
 return {spaces:results[0].results.map(s=>({...s,assignees:JSON.parse(s.assignees)})),notes:results[1].results,tasks:results[2].results.map(t=>({...t,done:!!t.done})),meetings:results[3].results.map(m=>({...m,agreement_items:JSON.parse(m.agreement_items)})),notifications:results[6].results,agreement_tasks:results[7].results,templates:results[4].results,members:JSON.parse(results[5].results[0]?.config_value||'[]')};
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
  const oldDetails=await db.prepare('SELECT * FROM space_details WHERE space_id=?').bind(id(p.id)).first();
  const s=space({...oldDetails,...p});
  const team=await db.prepare("SELECT config_value FROM team_config WHERE config_key='members'").first();
  assert(s.assignees.every(a=>JSON.parse(team.config_value).includes(a)),'Responsable fuera del equipo');
  const statement=db.prepare(`INSERT INTO spaces (${columns.spaces.join(',')}) VALUES (?,?,?,?,?,?,?,?,?,?,?)
   ON CONFLICT(id) DO UPDATE SET phone_or_group_id=excluded.phone_or_group_id,name=excluded.name,role=excluded.role,org_unit=excluded.org_unit,cut_code=excluded.cut_code,doc_ref=excluded.doc_ref,status=excluded.status,assignees=excluded.assignees,last_message=excluded.last_message,updated_at=excluded.updated_at WHERE spaces.updated_at=?`).bind(s.id,s.phone_or_group_id,s.name,s.role,s.org_unit,s.cut_code,s.doc_ref,s.status,JSON.stringify(s.assignees),s.last_message,now,s.updated_at);
  const [result]=await db.batch([statement,spaceDetailsStatement(db,s)]);
  assert(result.meta.changes>0,'Otra PC modificó este espacio. Actualiza y vuelve a editar.',409);return;
 }
 case 'DELETE_SPACE':statement=db.prepare('DELETE FROM spaces WHERE id=?').bind(id(p.id));break;
 case 'ADD_NOTE': {
  await requireSpace(db,id(p.space_id));
  await db.batch([db.prepare('INSERT INTO notes (id,space_id,author,content,created_at) VALUES (?,?,?,?,?)').bind(id(p.id),p.space_id,operator,text(p.content,'Nota',20000,true),now),db.prepare('UPDATE spaces SET updated_at=? WHERE id=?').bind(now,p.space_id)]);return;
 }
 case 'UPSERT_TASK': {
  const oldDetails=await db.prepare('SELECT * FROM task_details WHERE task_id=?').bind(id(p.id)).first();
  const t=task({...oldDetails,...p});await requireSpace(db,t.space_id);
  const team=await db.prepare("SELECT config_value FROM team_config WHERE config_key='members'").first();
  assert(JSON.parse(team.config_value).includes(t.assignee),'Responsable fuera del equipo');
  statement=db.prepare(`INSERT INTO tasks (id,space_id,title,assignee,due_date,done,created_by,created_at,updated_by) VALUES (?,?,?,?,?,?,?,?,?)
   ON CONFLICT(id) DO UPDATE SET title=excluded.title,assignee=excluded.assignee,due_date=excluded.due_date,done=excluded.done,updated_by=excluded.updated_by WHERE tasks.space_id=excluded.space_id`).bind(t.id,t.space_id,t.title,t.assignee,t.due_date,t.done?1:0,operator,now,operator);
  const [result]=await db.batch([statement,taskDetailsStatement(db,t,now)]);assert(result.meta.changes>0,'La tarea pertenece a otro espacio',409);return;
 }
 case 'DELETE_TASK':statement=db.prepare('DELETE FROM tasks WHERE id=?').bind(id(p.id));break;
 case 'ADD_MEETING': {
  const oldDetails=await db.prepare('SELECT * FROM meeting_details WHERE meeting_id=?').bind(id(p.id)).first();
  const oldItems=oldDetails?JSON.parse(oldDetails.agreement_items):[];
  const m=meeting({...oldDetails,agreement_items:oldItems,...p});await requireSpace(db,m.space_id);
  const linked=await db.prepare('SELECT 1 FROM agreement_tasks WHERE meeting_id=? LIMIT 1').bind(m.id).first();
  assert(!linked||JSON.stringify(m.agreement_items)===JSON.stringify(oldItems),'Gestiona en Tareas los acuerdos que ya fueron convertidos; conserva su texto y orden en la minuta.',409);
  statement=db.prepare(`INSERT INTO meetings (id,space_id,title,datetime,link,participants,agreements,created_by,created_at,updated_by) VALUES (?,?,?,?,?,?,?,?,?,?)
   ON CONFLICT(id) DO UPDATE SET title=excluded.title,datetime=excluded.datetime,link=excluded.link,participants=excluded.participants,agreements=excluded.agreements,updated_by=excluded.updated_by WHERE meetings.space_id=excluded.space_id`).bind(m.id,m.space_id,m.title,m.datetime,m.link,m.participants,m.agreements,operator,now,operator);
  const [result]=await db.batch([statement,meetingDetailsStatement(db,m)]);assert(result.meta.changes>0,'La reunión pertenece a otro espacio',409);return;
 }
 case 'DELETE_MEETING':statement=db.prepare('DELETE FROM meetings WHERE id=?').bind(id(p.id));break;
 case 'UPSERT_TEMPLATE': {
  const t=template(p);statement=db.prepare(`INSERT INTO templates (id,command,title,content,created_by,updated_by) VALUES (?,?,?,?,?,?)
   ON CONFLICT(id) DO UPDATE SET command=excluded.command,title=excluded.title,content=excluded.content,updated_by=excluded.updated_by`).bind(t.id,t.command,t.title,t.content,operator,operator);break;
 }
 case 'DELETE_TEMPLATE':statement=db.prepare('DELETE FROM templates WHERE id=?').bind(id(p.id));break;
 case 'SEND_NOTICE': {
  const recipient=await actor(db,p.recipient);assert(recipient!==operator,'Selecciona otro operador para enviar el aviso');
  const content=text(p.content,'Aviso',3000,true),noticeId=id(p.id);
  const contact=p.space_id?await db.prepare('SELECT id,name,cut_code FROM spaces WHERE id=?').bind(id(p.space_id)).first():null;
  assert(!p.space_id||contact,'El contacto ya no existe',404);
  const existing=await db.prepare('SELECT sender,recipient,content FROM notifications WHERE id=?').bind(noticeId).first();
  if(existing){assert(existing.sender===operator&&existing.recipient===recipient&&existing.content===content,'El identificador del aviso ya existe',409);return;}
  const writes=[db.prepare('INSERT INTO notifications (id,sender,recipient,space_id,contact_name,cut_code,content,created_at) VALUES (?,?,?,?,?,?,?,?)')
   .bind(noticeId,operator,recipient,contact?.id||null,contact?.name||text(p.contact_name||'','Contacto',200),contact?.cut_code||'',content,now)];
  if(contact)writes.push(db.prepare('INSERT INTO notes (id,space_id,author,content,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),contact.id,operator,`[Aviso interno a ${recipient}]\n${content}`,now),db.prepare('UPDATE spaces SET updated_at=? WHERE id=?').bind(now,contact.id));
  await db.batch(writes);return;
 }
 case 'READ_NOTICE':
 case 'ACK_NOTICE': {
  const sql=body.action==='ACK_NOTICE'
   ?"UPDATE notifications SET read_at=CASE WHEN read_at='' THEN ? ELSE read_at END,acknowledged_at=CASE WHEN acknowledged_at='' THEN ? ELSE acknowledged_at END WHERE id=? AND recipient=?"
   :"UPDATE notifications SET read_at=CASE WHEN read_at='' THEN ? ELSE read_at END WHERE id=? AND recipient=?";
  const values=body.action==='ACK_NOTICE'?[now,now,id(p.id),operator]:[now,id(p.id),operator];
  const result=await db.prepare(sql).bind(...values).run();assert(result.meta.changes>0,'El aviso no corresponde al operador activo',403);return;
 }
 case 'CREATE_AGREEMENT_TASKS': {
  const saved=await db.prepare('SELECT meetings.*,meeting_details.agreement_items FROM meetings JOIN meeting_details ON meeting_id=meetings.id WHERE meetings.id=?').bind(id(p.id)).first();
  assert(saved,'Reunión no encontrada',404);const items=JSON.parse(saved.agreement_items);
  assert(items.length,'Registra acuerdos con responsables antes de crear tareas');
  const team=JSON.parse((await db.prepare("SELECT config_value FROM team_config WHERE config_key='members'").first()).config_value);
  assert(items.every(a=>team.includes(a.assignee)),'Todos los acuerdos requieren un operador activo como responsable');
  const rows=items.map((a,index)=>({...a,index,task_id:crypto.randomUUID(),title:a.text.slice(0,500)})),json=JSON.stringify(rows);
  await db.batch([
   db.prepare(`INSERT INTO tasks (id,space_id,title,assignee,due_date,done,created_by,created_at,updated_by)
    SELECT json_extract(value,'$.task_id'),?,json_extract(value,'$.title'),json_extract(value,'$.assignee'),json_extract(value,'$.due_date'),0,?,?,?
    FROM json_each(?) WHERE NOT EXISTS (SELECT 1 FROM agreement_tasks WHERE meeting_id=? AND agreement_index=json_extract(value,'$.index'))`)
    .bind(saved.space_id,operator,now,operator,json,saved.id),
   db.prepare(`INSERT INTO task_details (task_id,stage,source_text,source_type,due_datetime,updated_at)
    SELECT json_extract(value,'$.task_id'),'Por hacer',json_extract(value,'$.text'),'Acuerdo','',? FROM json_each(?)
    WHERE EXISTS (SELECT 1 FROM tasks WHERE id=json_extract(value,'$.task_id'))`).bind(now,json),
   db.prepare(`INSERT OR IGNORE INTO agreement_tasks (meeting_id,agreement_index,task_id)
    SELECT ?,json_extract(value,'$.index'),json_extract(value,'$.task_id') FROM json_each(?)
    WHERE EXISTS (SELECT 1 FROM tasks WHERE id=json_extract(value,'$.task_id'))`).bind(saved.id,json)
  ]);
  return;
 }
 case 'UPDATE_MEMBERS': {
  const next=members(p.members);
  const all=await db.prepare('SELECT assignees FROM spaces').all();
  const tasks=await db.prepare('SELECT DISTINCT assignee FROM tasks WHERE done=0').all();
  const pendingNotices=await db.prepare("SELECT DISTINCT recipient FROM notifications WHERE acknowledged_at=''").all();
  const assigned=new Set([...all.results.flatMap(s=>JSON.parse(s.assignees)),...tasks.results.map(t=>t.assignee),...pendingNotices.results.map(n=>n.recipient)]);
  const removed=[...assigned].filter(x=>!next.includes(x));
  assert(!removed.length,`Resuelve primero los espacios, tareas pendientes y avisos de: ${removed.join(', ')}`);
  statement=db.prepare("INSERT INTO team_config VALUES ('members',?) ON CONFLICT(config_key) DO UPDATE SET config_value=excluded.config_value").bind(JSON.stringify(next));break;
 }
 default:throw new HttpError(400,'Acción desconocida');
 }
 await statement.run();
}
async function restore(db,backup){
 const d=validateBackup(backup);
 const statements=['notifications','agreement_tasks','notes','tasks','meetings','presence','spaces','templates','team_config'].map(table=>db.prepare(`DELETE FROM ${table}`));
 for(const table of Object.keys(columns)){
  const rows=d[table].map(row=>({...row,...(table==='tasks'?{done:row.done?1:0}:{})}));
  const names=columns[table];
  statements.push(db.prepare(`INSERT INTO ${table} (${names.join(',')}) SELECT ${names.map(k=>`json_extract(value,'$.${k}')`).join(',')} FROM json_each(?)`).bind(JSON.stringify(rows)));
 }
 statements.push(...restoreDetailsStatements(db,d));
 statements.push(db.prepare("INSERT INTO team_config VALUES ('members',?)").bind(JSON.stringify(d.members)));
 statements.push(db.prepare('INSERT INTO team_config (config_key,config_value) VALUES (?,?)').bind(TEAM_ROSTER_VERSION_KEY,'1'));
 statements.push(db.prepare("INSERT INTO team_config VALUES ('workspace_schema_v2','1')"));
 await db.batch(statements);
 return Object.fromEntries(Object.keys(columns).map(t=>[t,d[t].length]));
}
export async function onRequest({request,env}){
 const h=headers(request,env);const send=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:h});
 try{
  const path=new URL(request.url).pathname.replace(/^\/api\/?/,'').replace(/\/$/,'');
  assert(['sync','presence','backup','powerbi','notices'].includes(path),'Ruta no encontrada',404);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:h});
  await authenticate(request,env,path);
  await ensureInitialOperators(env.DB);
  await ensureWorkspaceSchema(env.DB);
  if(request.method==='GET'){
   if(path==='notices'){
    const operator=await actor(env.DB,new URL(request.url).searchParams.get('operator'));
    const [received,sent,unread]=await env.DB.batch([
     env.DB.prepare("SELECT * FROM notifications WHERE recipient=? ORDER BY (read_at='') DESC,created_at DESC LIMIT 100").bind(operator),
     env.DB.prepare('SELECT * FROM notifications WHERE sender=? ORDER BY created_at DESC LIMIT 100').bind(operator),
     env.DB.prepare("SELECT COUNT(*) AS total FROM notifications WHERE recipient=? AND read_at=''").bind(operator)]);
    return send({received:received.results,sent:sent.results,unread:unread.results[0].total});
   }
   if(path==='presence')return send({presence:await presence(env.DB,id(new URL(request.url).searchParams.get('space_id')))});
   const data=await readState(env.DB);
   if(path==='backup')return send({app:'crm-ana',schema_version:2,exported_at:new Date().toISOString(),data});
   if(path==='powerbi'){
    const tables=reportTables(data);
    return send({generated_at:new Date().toISOString(),Resumen_KPIs:tables['1_Resumen_KPIs'],Agenda_Espacios:tables['2_Agenda_Espacios'],Tareas_y_CUTs:tables['3_Tareas_y_CUTs'],Bitacora_Historica:tables['4_Bitacora_Historica'],Reuniones_Acuerdos:tables['5_Reuniones_Acuerdos']});
   }
   return send(data);
  }
  assert(request.method==='POST','Método no permitido',405);
  assert(!['powerbi','notices'].includes(path),'Método no permitido',405);
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

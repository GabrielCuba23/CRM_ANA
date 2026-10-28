import {STATUSES,UNITS,TASK_STAGES,identity,folded,availableUnits} from '../shared/domain.js';
export class HttpError extends Error {constructor(status,message){super(message);this.status=status;}}
export function assert(test,message,status=400){if(!test)throw new HttpError(status,message);}
export function text(value,name,max=500,required=false){
 assert(typeof value==='string',`${name}: se requiere texto`);
 const v=value.trim();assert(v.length<=max && (!required||v.length>0),`${name}: longitud inválida`);return v;
}
export function id(v){return text(v,'ID',100,true);}
export function members(v){assert(Array.isArray(v)&&v.length>0&&v.length<=50,'El equipo debe tener entre 1 y 50 integrantes');const a=v.map(x=>text(x,'Integrante',80,true));assert(new Set(a).size===a.length,'Integrantes duplicados');return a;}
function date(v,name,empty=false){
 if(empty && v==='')return '';
 const s=text(v,name,40,true);assert(/^\d{4}-\d\d-\d\dT/.test(s)&&Number.isFinite(Date.parse(s)),`${name}: fecha inválida`);return new Date(s).toISOString();
}
function due(v){if(!v)return '';const s=text(v,'Fecha límite',10,true);assert(/^\d{4}-\d\d-\d\d$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s,'Fecha límite inválida');return s;}
function link(v){const s=text(v||'','Enlace',2000);if(s){try{assert(['https:','http:'].includes(new URL(s).protocol),'El enlace debe ser HTTP o HTTPS');}catch{throw new HttpError(400,'Enlace inválido');}}return s;}
export function orgUnits(value){assert(Array.isArray(value)&&value.length<=100,'Se admiten hasta 100 órganos/unidades');const list=value.map(v=>text(v,'Órgano/unidad',80,true).replace(/\s+/g,' '));assert(new Set(list.map(folded)).size===list.length,'Órganos/unidades duplicados');return list;}
export function space(p,units=UNITS){
 const status=text(p.status||'Pendiente','Estado',40,true),org=text(p.org_unit||'ALA','Órgano',80,true);
 assert(STATUSES.includes(status),'Estado inválido');assert(units.includes(org),'Órgano inválido: añade primero la unidad al directorio');
 assert(Array.isArray(p.assignees)&&p.assignees.length<=50,'Responsables inválidos');
 return {id:id(p.id),phone_or_group_id:identity(text(p.phone_or_group_id,'Teléfono o grupo',200,true)),name:text(p.name,'Nombre',200,true),role:text(p.role||'','Cargo',300),org_unit:org,cut_code:text(p.cut_code||'','CUT',100),doc_ref:text(p.doc_ref||'','Documento',500),status,assignees:[...new Set(p.assignees.map(x=>text(x,'Responsable',80,true)))],last_message:text(p.last_message||'','Último mensaje',10000),updated_at:p.updated_at?date(p.updated_at,'Actualización'):'',email:email(p.email),extension:text(p.extension||'','Anexo',50),office:text(p.office||'','Oficina',300),entity:text(p.entity||'','Entidad',300),location:text(p.location||'','Ubicación',500)};
}
function email(value){const s=text(value||'','Correo',254);assert(!s||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s),'Correo inválido');return s;}
export function task(p){
 assert(typeof p.done==='boolean','La casilla done debe ser booleana');
 assert(!p.stage||TASK_STAGES.includes(p.stage),'Estado de tarea inválido');
 const stage=p.done?'Completado':p.stage==='Completado'?'Por hacer':p.stage||'Por hacer';
 const dueDateTime=p.due_datetime?date(p.due_datetime,'Vencimiento'):'';
 const dueDate=due(dueDateTime?new Date(Date.parse(dueDateTime)-5*3600000).toISOString().slice(0,10):p.due_date);
 const sourceType=p.source_type||'Texto';assert(['Texto','Audio','Documento','Acuerdo'].includes(sourceType),'Tipo de origen inválido');
 return {id:id(p.id),space_id:id(p.space_id),title:text(p.title,'Tarea',500,true),assignee:text(p.assignee,'Responsable',80,true),due_date:dueDate,done:p.done,stage,
 source_text:text(p.source_text||'','Mensaje de origen',20000),source_type:sourceType,due_datetime:dueDateTime,updated_at:p.updated_at?date(p.updated_at,'Actualización'):p.created_at?date(p.created_at,'Creación'):new Date().toISOString()};
}
export function meeting(p){
 const status=p.status||'Programada';assert(['Programada','Realizada','Cancelada'].includes(status),'Estado de reunión inválido');
 const items=p.agreement_items||[];assert(Array.isArray(items)&&items.length<=100,'Acuerdos inválidos');
 return {id:id(p.id),space_id:id(p.space_id),title:text(p.title,'Reunión',500,true),datetime:date(p.datetime,'Fecha reunión'),link:link(p.link),participants:text(p.participants||'','Participantes',3000),agreements:text(p.agreements||'','Acuerdos',20000),location:text(p.location||'','Sala presencial',500),status,
 agreement_items:items.map(a=>({text:text(a.text,'Acuerdo',2000,true),assignee:text(a.assignee||'','Responsable del acuerdo',80),due_date:due(a.due_date)}))};
}
export function calendarEvent(p){
 const start=date(p.datetime,'Inicio del evento'),end=date(p.end_datetime,'Fin del evento');
 assert(Date.parse(end)>Date.parse(start),'El fin del evento debe ser posterior al inicio');
 const status=p.status||'Programada';assert(['Programada','Realizada','Cancelada'].includes(status),'Estado de evento inválido');
 const revision=p.revision??0;assert(Number.isSafeInteger(revision)&&revision>=0,'Revisión de evento inválida');
 return {id:id(p.id),space_id:p.space_id?id(p.space_id):null,title:text(p.title,'Evento',500,true),datetime:start,end_datetime:end,description:text(p.description||'','Descripción',20000),participants:text(p.participants||'','Participantes',3000),location:text(p.location||'','Ubicación',500),link:link(p.link),status,revision};
}
export function notification(p){return {id:id(p.id),sender:text(p.sender,'Remitente',80,true),recipient:text(p.recipient,'Destinatario',80,true),space_id:p.space_id?id(p.space_id):null,contact_name:text(p.contact_name||'','Contacto',200),cut_code:text(p.cut_code||'','CUT',100),content:text(p.content,'Aviso',3000,true),created_at:date(p.created_at,'Fecha del aviso'),read_at:p.read_at?date(p.read_at,'Lectura'):'',acknowledged_at:p.acknowledged_at?date(p.acknowledged_at,'Confirmación'):''};}
export function template(p){const command=text(p.command,'Comando',40,true);assert(/^\/[a-z0-9_-]+$/i.test(command),'Usa un comando como /drive');return {id:id(p.id),command:command.toLowerCase(),title:text(p.title,'Título',200,true),content:text(p.content,'Formato',20000,true)};}
export const columns={
 spaces:['id','phone_or_group_id','name','role','org_unit','cut_code','doc_ref','status','assignees','last_message','updated_at'],
 notes:['id','space_id','author','content','created_at'],
 tasks:['id','space_id','title','assignee','due_date','done','created_by','created_at','updated_by'],
 meetings:['id','space_id','title','datetime','link','participants','agreements','created_by','created_at','updated_by'],
 templates:['id','command','title','content','created_by','updated_by'],
 calendar_events:['id','space_id','title','datetime','end_datetime','description','participants','location','link','status','created_by','created_at','updated_by','updated_at','revision']
};
export function validateBackup(raw){
 assert(raw?.app==='crm-ana'&&[1,2,3].includes(raw.schema_version),'Formato de copia incompatible');
 assert(raw.data&&typeof raw.data==='object','Copia sin datos');
 const d={...raw.data,calendar_events:raw.schema_version<3?[]:raw.data.calendar_events};
 const output={members:members(d.members),org_units:availableUnits(orgUnits(d.org_units||[]))};
 for(const table of Object.keys(columns))assert(Array.isArray(d[table])&&d[table].length<=10000,`Tabla ${table} inválida o demasiado grande`);
 const validators={spaces:p=>space(p,output.org_units),tasks:task,meetings:meeting,calendar_events:calendarEvent,templates:template,notes:p=>({id:id(p.id),space_id:id(p.space_id),author:text(p.author,'Autor',80,true),content:text(p.content,'Nota',20000,true)})};
 for(const [table,validate] of Object.entries(validators)){
   output[table]=d[table].map(row=>{
     const p=validate(row);
     for(const key of ['created_by','updated_by'])if(columns[table].includes(key))p[key]=text(row[key],key,80,true);
     if(columns[table].includes('created_at'))p.created_at=date(row.created_at,'Fecha de creación');
     if(table==='spaces')assert(p.updated_at,'Falta fecha de actualización');
     if(table==='calendar_events')p.updated_at=date(row.updated_at,'Actualización del evento');
     return p;
   });
   assert(new Set(output[table].map(x=>x.id)).size===output[table].length,`IDs duplicados en ${table}`);
 }
 const ids=new Set(output.spaces.map(s=>s.id));
 for(const table of ['notes','tasks','meetings'])for(const row of output[table])assert(ids.has(row.space_id),`Referencia huérfana en ${table}`);
 for(const row of output.calendar_events)assert(!row.space_id||ids.has(row.space_id),'Referencia huérfana en eventos');
 assert(new Set(output.spaces.map(s=>s.phone_or_group_id)).size===output.spaces.length,'Teléfonos o grupos duplicados');
 assert(new Set(output.templates.map(s=>s.command)).size===output.templates.length,'Comandos duplicados');
 assert(Array.isArray(d.notifications||[]),'Avisos inválidos');
 output.notifications=(d.notifications||[]).map(notification);
 assert(output.notifications.length<=10000,'Demasiados avisos');
 assert(new Set(output.notifications.map(n=>n.id)).size===output.notifications.length,'Avisos duplicados');
 for(const n of output.notifications)assert(!n.space_id||ids.has(n.space_id),'Referencia huérfana en avisos');
 const meetings=new Map(output.meetings.map(m=>[m.id,m]));const tasks=new Map(output.tasks.map(t=>[t.id,t]));
 assert(Array.isArray(d.agreement_tasks||[]),'Vínculos de acuerdos inválidos');
 output.agreement_tasks=(d.agreement_tasks||[]).map(a=>{
  const m=meetings.get(a.meeting_id),t=a.task_id?tasks.get(a.task_id):null;
  assert(m&&Number.isInteger(a.agreement_index)&&a.agreement_index>=0&&a.agreement_index<m.agreement_items.length,'Vínculo de acuerdo inválido');
  assert(!a.task_id||t&&t.space_id===m.space_id,'Tarea de acuerdo inválida');
  return {meeting_id:m.id,agreement_index:a.agreement_index,task_id:t?.id||null};
 });
 assert(new Set(output.agreement_tasks.map(a=>a.meeting_id+':'+a.agreement_index)).size===output.agreement_tasks.length,'Vínculos duplicados');
 return output;
}

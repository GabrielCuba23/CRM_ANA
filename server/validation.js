import {STATUSES,UNITS,identity} from '../shared/domain.js';
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
export function space(p){
 const status=text(p.status||'Pendiente','Estado',40,true),org=text(p.org_unit||'ALA','Órgano',30,true);
 assert(STATUSES.includes(status),'Estado inválido');assert(UNITS.includes(org),'Órgano inválido');
 assert(Array.isArray(p.assignees)&&p.assignees.length<=50,'Responsables inválidos');
 return {id:id(p.id),phone_or_group_id:identity(text(p.phone_or_group_id,'Teléfono o grupo',200,true)),name:text(p.name,'Nombre',200,true),role:text(p.role||'','Cargo',300),org_unit:org,cut_code:text(p.cut_code||'','CUT',100),doc_ref:text(p.doc_ref||'','Documento',500),status,assignees:[...new Set(p.assignees.map(x=>text(x,'Responsable',80,true)))],last_message:text(p.last_message||'','Último mensaje',10000),updated_at:p.updated_at?date(p.updated_at,'Actualización'):''};
}
export function task(p){assert(typeof p.done==='boolean','La casilla done debe ser booleana');return {id:id(p.id),space_id:id(p.space_id),title:text(p.title,'Tarea',500,true),assignee:text(p.assignee,'Responsable',80,true),due_date:due(p.due_date),done:p.done};}
export function meeting(p){return {id:id(p.id),space_id:id(p.space_id),title:text(p.title,'Reunión',500,true),datetime:date(p.datetime,'Fecha reunión'),link:link(p.link),participants:text(p.participants||'','Participantes',3000),agreements:text(p.agreements||'','Acuerdos',20000)};}
export function template(p){const command=text(p.command,'Comando',40,true);assert(/^\/[a-z0-9_-]+$/i.test(command),'Usa un comando como /drive');return {id:id(p.id),command:command.toLowerCase(),title:text(p.title,'Título',200,true),content:text(p.content,'Formato',20000,true)};}
export const columns={
 spaces:['id','phone_or_group_id','name','role','org_unit','cut_code','doc_ref','status','assignees','last_message','updated_at'],
 notes:['id','space_id','author','content','created_at'],
 tasks:['id','space_id','title','assignee','due_date','done','created_by','created_at','updated_by'],
 meetings:['id','space_id','title','datetime','link','participants','agreements','created_by','created_at','updated_by'],
 templates:['id','command','title','content','created_by','updated_by']
};
export function validateBackup(raw){
 assert(raw?.app==='crm-ana'&&raw.schema_version===1,'Formato de copia incompatible');
 const d=raw.data;assert(d&&typeof d==='object','Copia sin datos');
 const output={members:members(d.members)};
 for(const table of Object.keys(columns))assert(Array.isArray(d[table])&&d[table].length<=10000,`Tabla ${table} inválida o demasiado grande`);
 const validators={spaces:space,tasks:task,meetings:meeting,templates:template,notes:p=>({id:id(p.id),space_id:id(p.space_id),author:text(p.author,'Autor',80,true),content:text(p.content,'Nota',20000,true)})};
 for(const [table,validate] of Object.entries(validators)){
   output[table]=d[table].map(row=>{
     const p=validate(row);
     for(const key of ['created_by','updated_by'])if(columns[table].includes(key))p[key]=text(row[key],key,80,true);
     if(columns[table].includes('created_at'))p.created_at=date(row.created_at,'Fecha de creación');
     if(table==='spaces')assert(p.updated_at,'Falta fecha de actualización');
     return p;
   });
   assert(new Set(output[table].map(x=>x.id)).size===output[table].length,`IDs duplicados en ${table}`);
 }
 const ids=new Set(output.spaces.map(s=>s.id));
 for(const table of ['notes','tasks','meetings'])for(const row of output[table])assert(ids.has(row.space_id),`Referencia huérfana en ${table}`);
 assert(new Set(output.spaces.map(s=>s.phone_or_group_id)).size===output.spaces.length,'Teléfonos o grupos duplicados');
 assert(new Set(output.templates.map(s=>s.command)).size===output.templates.length,'Comandos duplicados');
 return output;
}

import assert from 'node:assert/strict';
import {startRuntime,client} from './runtime.mjs';
const runtime=await startRuntime();const api=client(runtime);
let passed=0;
async function check(name,fn){await fn();passed++;console.log('PASS '+name);}
const actor='Marco';
const write=(action,payload)=>api('sync',{action,payload,operator_name:actor});
try{
 await check('API protegida y sin caché',async()=>{assert.equal((await api('sync',undefined,'incorrecto')).status,401);const r=await api();assert.equal(r.status,200);assert.match(r.headers.get('Cache-Control'),/no-store/);assert.equal(r.value.members.length,4);assert.equal((await api('sync?token='+encodeURIComponent(runtime.token),undefined,'')).status,401);});
 await check('CRUD espacios con normalización y conflicto de versiones',async()=>{
 const p={id:'s1',name:'Contacto de prueba',phone_or_group_id:'+51 987 654 321',org_unit:'ALA',status:'Urgente',assignees:['Marco'],cut_code:'CUT-148920-2026',doc_ref:'Informe técnico 042'};
 assert.equal((await write('UPSERT_SPACE',p)).status,200);assert.equal((await write('UPSERT_SPACE',{...p,name:'Conflicto'})).status,409);
 const s=(await api()).value.spaces[0];assert.equal(s.phone_or_group_id,'51987654321');assert.equal((await write('UPSERT_SPACE',{...s,role:'Especialista'})).status,200);
 });
 await check('autor automático, tarea y minuta persistidas',async()=>{
 assert.equal((await write('ADD_NOTE',{id:'n1',space_id:'s1',content:'Aforo del río',author:'Autor falsificado'})).status,200);
 assert.equal((await write('UPSERT_TASK',{id:'t1',space_id:'s1',title:'Validar informe',assignee:'Lucía',due_date:'2026-11-01',done:false})).status,200);
 assert.equal((await write('ADD_MEETING',{id:'m1',space_id:'s1',title:'Mesa de coordinación',datetime:'2026-11-01T15:00:00Z',link:'https://meet.google.com/',participants:'Marco y Lucía',agreements:'Revisar informe'})).status,200);
 assert.equal((await write('UPSERT_TEMPLATE',{id:'f1',command:'/oficio',title:'Código CUT',content:'Comparta su código CUT.'})).status,200);
 const state=(await api()).value;assert.equal(state.notes[0].author,'Marco');assert.equal(state.tasks[0].created_by,'Marco');assert.equal(state.meetings[0].created_by,'Marco');
 assert.equal((await write('UPSERT_TASK',{...state.tasks[0],done:true})).status,200);
 });
 await check('latidos de dos PC y retirada de presencia',async()=>{
 for(const [pc,device,operator] of [['pc1','dev1','Marco'],['pc2','dev2','Lucía']])assert.equal((await api('presence',{pc_id:pc,device_id:device,space_id:'s1',operator_name:operator})).status,200);
 assert.equal((await api('presence?space_id=s1')).value.presence.length,2);
 await api('presence',{pc_id:'pc2',device_id:'dev2',operator_name:'Lucía',space_id:'s1',leave:true});assert.equal((await api('presence?space_id=s1')).value.presence.length,1);
 });
 await check('Power BI devuelve las cinco tablas normalizadas',async()=>{
 const r=await api('powerbi?token='+encodeURIComponent(runtime.token),undefined,'');assert.equal(r.status,200);assert.equal(r.value.Agenda_Espacios[0].Codigo_CUT,'CUT-148920-2026');assert.equal(r.value.Resumen_KPIs[1].Tareas_Completadas,1);assert.equal(Object.keys(r.value).length,6);
 });
 let backup;
 await check('respaldo completo y validación de restauración sin pérdida',async()=>{
 backup=(await api('backup')).value;const invalid=structuredClone(backup);invalid.data.notes[0].space_id='missing';
 assert.equal((await api('backup',{confirm:'RESTAURAR',operator_name:actor,backup:invalid})).status,400);
 assert.equal((await api()).value.spaces.length,1);assert.equal(backup.data.members.length,4);assert.equal(Object.hasOwn(backup.data,'presence'),false);
 });
 await check('restauración atómica, integrantes y copia de ida/vuelta',async()=>{
 await write('UPDATE_MEMBERS',{members:['Marco','Lucía','Diego','Carla','Ana']});assert.equal((await api()).value.members.length,5);
 await write('DELETE_SPACE',{id:'s1'});let s=(await api()).value;assert.equal(s.spaces.length,0);assert.equal(s.notes.length,0);
 assert.equal((await api('backup',{confirm:'RESTAURAR',operator_name:actor,backup})).status,200);
 s=(await api()).value;assert.equal(s.members.length,4);assert.equal(s.spaces.length,1);assert.equal(s.notes.length,1);assert.equal(s.tasks[0].done,true);assert.equal((await api('presence?space_id=s1')).value.presence.length,0);
 });
 await check('validaciones, integrantes asignados y acciones desconocidas',async()=>{
 assert.equal((await write('UPDATE_MEMBERS',{members:['Lucía']})).status,400);
 assert.equal((await write('UNKNOWN',{})).status,400);
 assert.equal((await write('UPSERT_TASK',{id:'t2',space_id:'missing',title:'Sin padre',assignee:'Marco',done:false})).status,404);
 assert.equal((await write('ADD_MEETING',{id:'m2',space_id:'s1',title:'Inválida',datetime:'2026-11-01T15:00:00Z',link:'javascript:alert(1)'})).status,400);
 assert.equal((await api('sync',{action:'ADD_NOTE',operator_name:'Intruso',payload:{}})).status,403);
 });
 await check('CORS de extensión y bloqueo de origen ajeno',async()=>{
 for(const [origin,expected] of [['chrome-extension://abcdefghijklmnopabcdefghijklmnop',true],['https://sitio-ajeno.example',false]]){
 const r=await fetch(runtime.base+'/api/sync',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Headers':'X-Team-Token'}});assert.equal(r.status,204);assert.equal(!!r.headers.get('Access-Control-Allow-Origin'),expected);
 }
 });
 console.log(`Integración D1: ${passed} escenarios completos aprobados.`);
}finally{runtime.close();}

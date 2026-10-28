import assert from 'node:assert/strict';
import {startRuntime,client} from './runtime.mjs';
const runtime=await startRuntime(8792),api=client(runtime);
const write=(action,payload,operator_name='Acxel')=>api('sync',{action,payload,operator_name});
let passed=0;async function check(name,fn){await fn();passed++;console.log('PASS '+name);}
try{
 await check('ficha institucional ampliada y control de versión',async()=>{
  assert.equal((await write('UPSERT_SPACE',{id:'s1',name:'Jaruska · Coordinación',phone_or_group_id:'51987654321',role:'Coordinadora',org_unit:'ALA',assignees:['Acxel'],email:'contacto@example.org',extension:'204',office:'ALA de prueba',entity:'ANA',location:'Sala institucional',cut_code:'CUT-2026-100',status:'Pendiente'})).status,200);
  const s=(await api()).value.spaces[0];assert.equal(s.email,'contacto@example.org');assert.equal(s.extension,'204');assert.equal(s.office,'ALA de prueba');
  assert.equal((await write('UPSERT_SPACE',{...s,email:'correo inválido'})).status,400);assert.equal((await api()).value.spaces[0].email,'contacto@example.org');
  assert.equal((await write('UPSERT_SPACE',{...s,role:'Coordinación institucional'})).status,200);
  assert.equal((await write('UPSERT_SPACE',{...s,email:'cambio-obsoleto@example.org'})).status,409);
  assert.equal((await api()).value.spaces[0].email,'contacto@example.org');
 });
 await check('texto de origen, cuatro estados y vencimiento con hora',async()=>{
  const t={id:'t1',space_id:'s1',title:'Enviar expediente',assignee:'Fernando',due_date:'2026-11-01',due_datetime:'2026-11-01T16:00:00-05:00',done:false,stage:'En proceso',source_text:'Por favor envía el expediente antes del plazo indicado.',source_type:'Texto'};
  assert.equal((await write('UPSERT_TASK',t)).status,200);let saved=(await api()).value.tasks.find(t=>t.id==='t1');assert.equal(saved.stage,'En proceso');assert.equal(saved.source_text,t.source_text);assert.equal(saved.due_datetime,'2026-11-01T21:00:00.000Z');
  assert.equal((await write('UPSERT_TASK',{...saved,stage:'En revisión'})).status,200);
  saved=(await api()).value.tasks.find(t=>t.id==='t1');assert.equal(saved.stage,'En revisión');assert.equal((await write('UPSERT_TASK',{...saved,done:true})).status,200);assert.equal((await api()).value.tasks.find(t=>t.id==='t1').stage,'Completado');
 });
 await check('reuniones, acuerdos estructurados y tareas sin duplicados',async()=>{
  const m={id:'m1',space_id:'s1',title:'Mesa de trabajo',datetime:'2026-11-02T15:00:00Z',location:'Sala de coordinación',status:'Programada',participants:'Acxel y Jaruska',agreements:'Seguimiento',agreement_items:[{text:'Consolidar informe',assignee:'Jaruska',due_date:'2026-11-03'},{text:'Validar anexos',assignee:'Fernando',due_date:'2026-11-04'}]};
  assert.equal((await write('ADD_MEETING',m)).status,200);let saved=(await api()).value.meetings[0];assert.equal(saved.location,m.location);assert.equal(saved.agreement_items.length,2);
  assert.equal((await write('CREATE_AGREEMENT_TASKS',{id:'m1'})).status,200);assert.equal((await write('CREATE_AGREEMENT_TASKS',{id:'m1'})).status,200);
  let state=(await api()).value;assert.equal(state.tasks.length,3);assert.equal(state.agreement_tasks.length,2);assert.equal(state.tasks.filter(t=>t.source_type==='Acuerdo').length,2);
  assert.equal((await write('ADD_MEETING',{...saved,status:'Realizada'})).status,200);
  assert.equal((await write('ADD_MEETING',{...saved,agreement_items:[]})).status,409);
 });
 await check('aviso persistente para otro operador e historial del contacto',async()=>{
  const notice={id:'notice1',space_id:'s1',recipient:'Jaruska',content:'Este contacto desea conversar contigo. Revisa el expediente.'};
  assert.equal((await write('SEND_NOTICE',notice)).status,200);assert.equal((await write('SEND_NOTICE',notice)).status,200);
  const received=await api('notices?operator=Jaruska');assert.equal(received.value.unread,1);assert.equal(received.value.received.length,1);assert.equal(received.value.received[0].sender,'Acxel');assert.equal(received.value.received[0].contact_name,'Jaruska · Coordinación');
  const sent=await api('notices?operator=Acxel');assert.equal(sent.value.sent.length,1);assert.equal(sent.value.received.length,0);
  assert.equal((await api()).value.notes.filter(n=>n.content.includes('[Aviso interno a Jaruska]')).length,1);
  assert.equal((await write('READ_NOTICE',{id:'notice1'},'Marco')).status,403);
  assert.equal((await write('READ_NOTICE',{id:'notice1'},'Jaruska')).status,200);
  assert.equal((await api('notices?operator=Jaruska')).value.unread,0);
  assert.equal((await write('ACK_NOTICE',{id:'notice1'},'Jaruska')).status,200);
  assert.ok((await api('notices?operator=Acxel')).value.sent[0].acknowledged_at);
 });
 await check('Power BI incluye directorio, estados y acuerdos ampliados',async()=>{
  const result=(await api('powerbi')).value;assert.equal(result.Agenda_Espacios[0].Correo,'contacto@example.org');assert.equal(result.Agenda_Espacios[0].Anexo,'204');assert.equal(result.Tareas_y_CUTs.find(t=>t.ID_Tarea==='t1').Estado,'Completado');assert.match(result.Reuniones_Acuerdos[0].Acuerdos_Pactados,/Jaruska/);assert.equal(result.Reuniones_Acuerdos[0].Estado_Reunion,'Realizada');
 });
 await check('respaldo v3 conserva avisos, detalles y vínculos al restaurar',async()=>{
  const backup=(await api('backup')).value;assert.equal(backup.schema_version,3);assert.equal(backup.data.notifications.length,1);assert.equal(backup.data.agreement_tasks.length,2);
  const invalid=structuredClone(backup);invalid.data.notifications[0].space_id='missing';assert.equal((await api('backup',{confirm:'RESTAURAR',operator_name:'Acxel',backup:invalid})).status,400);
  assert.equal((await write('DELETE_SPACE',{id:'s1'})).status,200);assert.equal((await api()).value.spaces.length,0);
  assert.equal((await api('backup',{confirm:'RESTAURAR',operator_name:'Acxel',backup})).status,200);
  const restored=(await api()).value;assert.equal(restored.spaces[0].email,'contacto@example.org');assert.equal(restored.tasks.length,3);assert.equal(restored.agreement_tasks.length,2);assert.equal(restored.notifications[0].recipient,'Jaruska');assert.ok(restored.notifications[0].acknowledged_at);
 });
 await check('copia antigua v1 sigue siendo restaurable sin entidades nuevas',async()=>{
  const legacy=(await api('backup')).value;legacy.schema_version=1;delete legacy.data.notifications;delete legacy.data.agreement_tasks;
  for(const s of legacy.data.spaces)for(const key of ['email','extension','office','entity','location'])delete s[key];
  for(const t of legacy.data.tasks)for(const key of ['stage','source_text','source_type','due_datetime','updated_at'])delete t[key];
  for(const m of legacy.data.meetings)for(const key of ['agreement_items','location','status'])delete m[key];
  assert.equal((await api('backup',{confirm:'RESTAURAR',operator_name:'Acxel',backup:legacy})).status,200);
  const restored=(await api()).value;assert.equal(restored.spaces.length,1);assert.equal(restored.spaces[0].email,'');assert.equal(restored.notifications.length,0);assert.equal(restored.tasks.find(t=>t.id==='t1').stage,'Completado');
 });
 console.log(`Workspace: ${passed} escenarios D1 aprobados.`);
}finally{runtime.close();}

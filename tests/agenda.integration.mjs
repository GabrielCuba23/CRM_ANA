import assert from 'node:assert/strict';
import {startRuntime,client} from './runtime.mjs';
const runtime=await startRuntime(8796),api=client(runtime),write=(action,payload,operator_name='Acxel')=>api('sync',{action,payload,operator_name});
let passed=0;async function check(name,fn){await fn();passed++;console.log('PASS '+name);}
try{
 await check('unidades compartidas, duplicados y contacto con unidad personalizada',async()=>{
  let state=(await api()).value;assert.ok(state.org_units.includes('Sede Central'));assert.ok(state.org_units.includes('Prensa'));
  assert.equal((await write('ADD_ORG_UNIT',{name:'Comunicaciones regionales'})).status,200);assert.equal((await write('ADD_ORG_UNIT',{name:'comunicaciones regionales'})).status,409);
  const contact={id:'s1',name:'Contacto de agenda',phone_or_group_id:'51987654321',assignees:['Acxel'],org_unit:'Comunicaciones regionales'};assert.equal((await write('UPSERT_SPACE',contact)).status,200);
  assert.equal((await write('UPSERT_SPACE',{...contact,id:'bad',phone_or_group_id:'51987654322',org_unit:'Unidad no registrada'})).status,400);
 });
 const base={id:'e1',title:'Evento general ANA',datetime:'2026-11-05T15:00:00Z',end_datetime:'2026-11-05T16:00:00Z',description:'Agenda general',space_id:null,status:'Programada'};
 await check('evento sin contacto, autor del servidor, edición concurrente y validación',async()=>{
  assert.equal((await write('UPSERT_EVENT',{...base,created_by:'Intruso'})).status,200);let e=(await api()).value.calendar_events[0];assert.equal(e.space_id,null);assert.equal(e.created_by,'Acxel');assert.equal(e.revision,0);
  assert.equal((await write('UPSERT_EVENT',{...e,title:'Evento actualizado'},'Jaruska')).status,200);assert.equal((await write('UPSERT_EVENT',e)).status,409);e=(await api()).value.calendar_events[0];assert.equal(e.created_by,'Acxel');assert.equal(e.updated_by,'Jaruska');assert.equal(e.revision,1);
  assert.equal((await write('UPSERT_EVENT',{...base,id:'bad-time',end_datetime:base.datetime})).status,400);assert.equal((await write('UPSERT_EVENT',{...base,id:'bad-space',space_id:'missing'})).status,404);
 });
 await check('eliminar una nota valida su espacio y conserva las restantes',async()=>{
  await write('ADD_NOTE',{id:'n1',space_id:'s1',content:'Eliminar esta nota'});await write('ADD_NOTE',{id:'n2',space_id:'s1',content:'Conservar esta nota'});
  assert.equal((await write('DELETE_NOTE',{id:'n1',space_id:'otro'})).status,409);assert.equal((await api()).value.notes.length,2);
  assert.equal((await write('DELETE_NOTE',{id:'n1',space_id:'s1'})).status,200);const notes=(await api()).value.notes;assert.equal(notes.length,1);assert.equal(notes[0].id,'n2');assert.equal((await write('DELETE_NOTE',{id:'n1',space_id:'s1'})).status,404);
 });
 await check('copia v3 restaura eventos y unidades; Power BI los incluye y borrar contacto desvincula el evento',async()=>{
  assert.equal((await write('UPSERT_EVENT',{...base,id:'e2',space_id:'s1'})).status,200);
  const backup=(await api('backup')).value;assert.equal(backup.schema_version,3);assert.equal(backup.data.calendar_events.length,2);assert.ok(backup.data.org_units.includes('Comunicaciones regionales'));
  const invalid=structuredClone(backup);invalid.data.calendar_events[0].space_id='missing';assert.equal((await api('backup',{confirm:'RESTAURAR',operator_name:'Acxel',backup:invalid})).status,400);
  assert.equal((await write('DELETE_SPACE',{id:'s1'})).status,200);assert.equal((await api()).value.calendar_events.find(e=>e.id==='e2').space_id,null);
  assert.equal((await api('backup',{confirm:'RESTAURAR',operator_name:'Acxel',backup})).status,200);assert.equal((await api()).value.calendar_events.find(e=>e.id==='e2').space_id,'s1');
  const rows=(await api('powerbi')).value.Reuniones_Acuerdos;assert.equal(rows.length,2);assert.ok(rows.every(r=>r.Tipo_Registro==='Evento'));assert.equal(rows.find(r=>r.ID_Reunion==='e2').Contacto_Espacio,'Contacto de agenda');
 });
 await check('eliminar evento controla revisión; los respaldos v2 siguen restaurándose',async()=>{
  const e=(await api()).value.calendar_events.find(e=>e.id==='e1');assert.equal((await write('DELETE_EVENT',{id:e.id,revision:0})).status,409);assert.equal((await write('DELETE_EVENT',{id:e.id,revision:e.revision})).status,200);
  const legacy=(await api('backup')).value;legacy.schema_version=2;delete legacy.data.calendar_events;assert.equal((await api('backup',{confirm:'RESTAURAR',operator_name:'Acxel',backup:legacy})).status,200);assert.equal((await api()).value.calendar_events.length,0);
 });
 console.log(`Agenda: ${passed} escenarios D1 aprobados.`);
}finally{runtime.close();}

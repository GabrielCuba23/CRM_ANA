import test from 'node:test';
import assert from 'node:assert/strict';
import {createCalendarIcs,googleCalendarUrl,eventEnd,calendarItems} from '../shared/calendar.js';
import {calendarEvent,orgUnits} from '../server/validation.js';
import {remindersFor,filterReport} from '../shared/planning.js';
import {reportTables} from '../shared/domain.js';
const event={kind:'event',id:'evt-1',space_id:null,title:'Coordinación, ANA; Perú',datetime:'2026-10-28T15:00:00Z',end_datetime:'2026-10-28T16:30:00Z',description:'Tema uno\nTema dos',location:'Sede Central',participants:'Acxel y Jaruska',created_by:'Acxel',created_at:'2026-10-28T12:00:00Z',updated_at:'2026-10-28T13:00:00Z',status:'Programada',revision:1};
test('exportación calendario conserva instantes y duración; Google prepara guardar sin invitar asistentes',()=>{
 const url=new URL(googleCalendarUrl(event));assert.equal(url.origin,'https://calendar.google.com');assert.equal(url.searchParams.get('dates'),'20261028T150000Z/20261028T163000Z');assert.equal(url.searchParams.get('ctz'),'America/Lima');assert.equal(url.searchParams.get('action'),'TEMPLATE');assert.equal(url.searchParams.has('add'),false);assert.match(url.searchParams.get('details'),/Tema uno/);
 assert.equal(eventEnd({datetime:event.datetime}),'2026-10-28T16:00:00.000Z');
 assert.ok(googleCalendarUrl({...event,description:'Perú 🦙 '.repeat(5000)}).length<=7500);
});
test('archivo ICS protege líneas de texto, pliega UTF-8 y mantiene UID estable al editar o cancelar',()=>{
 const value={...event,title:'Perú 🦙 '.repeat(30)+'\r\nBEGIN:VALARM',description:'a,b;c\\d\ntexto'};
 const ics=createCalendarIcs([value],[],new Date('2026-10-28T14:00:00Z'));
 assert.ok(ics.endsWith('\r\n'));for(const line of ics.split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75);
 const unfolded=ics.replace(/\r\n /g,'');assert.ok(!unfolded.includes('\r\nBEGIN:VALARM'));assert.ok(unfolded.includes('\\nBEGIN:VALARM'));assert.match(unfolded,/DESCRIPTION:a\\,b\\;c\\\\d\\ntexto/);
 const next=createCalendarIcs([{...event,status:'Cancelada',revision:2}]);assert.equal(next.match(/UID:(.*)\r\n/)[1],ics.match(/UID:(.*)\r\n/)[1]);assert.match(next,/STATUS:CANCELLED/);assert.match(next,/SEQUENCE:2/);assert.ok(!ics.includes('ATTENDEE:'));assert.ok(!ics.includes('TEAM_TOKEN'));
});
test('eventos generales participan en agenda, recordatorios y reportes; valida el fin y unidades personalizadas',()=>{
 const data={spaces:[],notes:[],tasks:[],meetings:[],calendar_events:[event],members:['Acxel']};
 assert.equal(calendarItems(data)[0].kind,'event');assert.equal(remindersFor(data,'Acxel',Date.parse(event.datetime)-600000)[0].kind,'Evento en 15 minutos');assert.equal(filterReport(data,{member:'Acxel'}).calendar_events.length,1);assert.equal(reportTables(data)['5_Reuniones_Acuerdos'][0].Tipo_Registro,'Evento');
 assert.equal(calendarEvent(event).space_id,null);assert.throws(()=>calendarEvent({...event,end_datetime:event.datetime}),/posterior/);assert.throws(()=>calendarEvent({...event,revision:-1}),/Revisión/);assert.deepEqual(orgUnits(['  Oficina   de Comunicaciones  ']),['Oficina de Comunicaciones']);assert.throws(()=>orgUnits(['Prensa','prensa']),/duplicados/);
});

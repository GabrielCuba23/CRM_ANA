import test from 'node:test';
import assert from 'node:assert/strict';
import {remindersFor,filterReport,reportPeriod} from '../shared/planning.js';
import {minuteText} from '../shared/domain.js';
const now=Date.parse('2026-10-27T15:00:00Z');
const data={spaces:[{id:'s1',name:'Contacto',assignees:['Acxel'],cut_code:'CUT-100'}],members:['Acxel','Jaruska'],notes:[{id:'n1',space_id:'s1',author:'Acxel',created_at:'2026-10-01T10:00:00Z'}],tasks:[{id:'t1',space_id:'s1',assignee:'Acxel',title:'Tarea próxima',due_datetime:'2026-10-27T15:30:00Z',done:false,created_at:'2026-09-01T10:00:00Z'}],meetings:[{id:'m1',space_id:'s1',title:'Reunión',datetime:'2026-10-27T15:10:00Z',status:'Programada',agreements:'',agreement_items:[{text:'Enviar oficio',assignee:'Jaruska',due_date:'2026-10-28'}]}]};
test('recordatorios de reunión a 15 minutos y tareas a una hora, con hora de Perú',()=>{
 const reminders=remindersFor(data,'Acxel',now);assert.equal(reminders.length,2);assert.match(reminders[0].kind,/Reunión/);assert.equal(remindersFor(data,'',now).length,0);
 const copy=structuredClone(data);copy.meetings[0].status='Cancelada';copy.tasks[0].done=true;assert.equal(remindersFor(copy,'Acxel',now).length,0);
 const overdue=structuredClone(data);overdue.tasks[0].due_datetime='2026-10-27T14:00:00Z';assert.match(remindersFor(overdue,'Acxel',now)[0].kind,/vencida/);
});
test('reporte semanal o mensual conserva pendientes anteriores y filtra historia',()=>{
 assert.deepEqual(reportPeriod('week',new Date(now)),{from:'2026-10-26',to:'2026-11-01'});assert.deepEqual(reportPeriod('month',new Date(now)),{from:'2026-10-01',to:'2026-10-31'});
 const filtered=filterReport(data,{from:'2026-10-26',to:'2026-11-01',member:'Acxel'});assert.equal(filtered.tasks.length,1);assert.equal(filtered.notes.length,0);assert.equal(filtered.meetings.length,1);
});
test('la minuta incluye acuerdo, responsable y fecha de cumplimiento',()=>{const text=minuteText(data.meetings[0],data.spaces[0]);assert.match(text,/Enviar oficio \| Responsable: Jaruska \| Cumplimiento: 2026-10-28/);});

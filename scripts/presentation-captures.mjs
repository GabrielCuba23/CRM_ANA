import {mkdir,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {chromium} from 'playwright';
import {startRuntime,client} from '../tests/runtime.mjs';
import {peruDay} from '../shared/planning.js';

const output='docs/capacitacion/capturas';
await mkdir(output,{recursive:true});
const runtime=await startRuntime(8799),api=client(runtime);
const browser=await chromium.launch({executablePath:existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined,headless:true,args:['--no-sandbox']});
const errors=[];
async function save(action,payload){const r=await api('sync',{action,payload,operator_name:'Acxel'});if(r.status!==200)throw new Error(r.value.error||'No se pudo preparar la demostración.');}
try{
 const tomorrow=peruDay(Date.now()+86400000),month=tomorrow.slice(0,7);
 const spaces=[
  {id:'demo-prensa',name:'[Demo] Coordinación de Prensa',org_unit:'Prensa',status:'En elaboración',role:'Contacto de capacitación',assignees:['Acxel','Jaruska']},
  {id:'demo-sede',name:'[Demo] Sede Central',org_unit:'Sede Central',status:'Pendiente',role:'Mesa de coordinación',assignees:['Fernando']},
  {id:'demo-ala',name:'[Demo] Coordinación ALA',org_unit:'ALA',status:'Urgente',role:'Seguimiento institucional',assignees:['Shirley','Acxel']}
 ];
 for(const [i,s] of spaces.entries())await save('UPSERT_SPACE',{...s,phone_or_group_id:s.id,cut_code:'CUT-DEMO-00'+(i+1),doc_ref:'Documento de capacitación '+(i+1),office:s.org_unit,entity:'ANA'});
 await save('ADD_NOTE',{id:'demo-nota',space_id:'demo-prensa',content:'Se coordinó la revisión del material institucional. Jaruska revisará la propuesta y Acxel registrará el avance.'});
 for(const [i,stage] of ['Por hacer','En proceso','En revisión','Completado'].entries())await save('UPSERT_TASK',{id:'demo-tarea-'+i,space_id:spaces[i%3].id,title:['Validar informe','Preparar propuesta','Revisar material institucional','Registrar acuerdos'][i],assignee:['Acxel','Fernando','Jaruska','Shirley'][i],due_date:tomorrow,stage,done:stage==='Completado',source_type:'Texto',source_text:'Ejemplo de capacitación: revisar el documento de coordinación.'});
 await save('ADD_MEETING',{id:'demo-reunion',space_id:'demo-prensa',title:'[Demo] Revisión de material institucional',datetime:tomorrow+'T15:00:00.000Z',participants:'Acxel y Jaruska',location:'Sede Central',status:'Programada',agreements:'Revisar la propuesta y comunicar las observaciones.',agreement_items:[{text:'Validar el material institucional',assignee:'Jaruska',due_date:tomorrow}]});
 await save('UPSERT_EVENT',{id:'demo-evento',title:'[Demo] Reunión del equipo',datetime:month+'-28T14:00:00.000Z',end_datetime:month+'-28T15:00:00.000Z',description:'Revisión de pendientes y próximos entregables.',participants:'Equipo de coordinación',location:'Sede Central',status:'Programada'});
 await save('SEND_NOTICE',{id:'demo-aviso',space_id:'demo-prensa',recipient:'Jaruska',content:'El contacto solicita conversar contigo sobre la propuesta. Revisa su ficha y confirma Recibido.'});
 const context=await browser.newContext({viewport:{width:1600,height:1000},deviceScaleFactor:1});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(runtime.base);
 await page.setViewportSize({width:450,height:900});
 await page.getByLabel('Token de acceso del equipo').waitFor();
 await page.screenshot({path:output+'/01-acceso.png'});
 await page.getByLabel('Token de acceso del equipo').fill(runtime.token);
 await page.getByRole('button',{name:'Entrar al espacio de trabajo'}).click();
 await page.getByLabel('¿Quién opera esta PC?').selectOption('Acxel');
 await page.setViewportSize({width:1600,height:1000});
 await page.locator('.space-card').first().waitFor();
 await page.screenshot({path:output+'/02-directorio.png'});
 const nav=page.getByRole('navigation',{name:'Navegación principal'});
 await page.locator('.space-card').filter({hasText:'[Demo] Coordinación de Prensa'}).click();
 await page.locator('.detail').waitFor();
 await page.locator('.detail').screenshot({path:output+'/03-bitacora.png'});
 await page.getByRole('button',{name:'Avisar a otro operador',exact:true}).click();
 await page.getByRole('dialog').screenshot({path:output+'/04-enviar-aviso.png'});
 await page.getByRole('dialog').getByRole('button',{name:'Cerrar diálogo',exact:true}).click();
 await page.locator('.detail-tabs').getByRole('button',{name:'Reuniones',exact:true}).click();
 await page.locator('.meeting').screenshot({path:output+'/05-reunion.png'});
 await page.locator('.detail-tabs').getByRole('button',{name:'Formatos /',exact:true}).click();
 await page.locator('.detail').screenshot({path:output+'/06-formatos.png'});
 await nav.getByRole('button',{name:'Tareas',exact:true}).click();
 await page.getByRole('button',{name:'Tablero Kanban',exact:true}).click();
 await page.locator('.task-board').waitFor();
 await page.screenshot({path:output+'/07-tareas.png'});
 await nav.getByRole('button',{name:'Agenda',exact:true}).click();
 await page.getByRole('heading',{name:'Agenda del equipo'}).waitFor();
 await page.screenshot({path:output+'/08-agenda.png'});
 await page.getByRole('button',{name:'Nuevo evento',exact:true}).click();
 await page.getByRole('dialog').getByLabel('Título del evento').fill('[Demo] Mesa de coordinación');
 await page.getByRole('dialog').screenshot({path:output+'/09-nuevo-evento.png'});
 await page.getByRole('dialog').getByRole('button',{name:'Cerrar diálogo',exact:true}).click();
 await nav.getByRole('button',{name:'Centro de datos',exact:true}).click();
 await page.getByRole('heading',{name:'Centro de datos'}).waitFor();
 await page.screenshot({path:output+'/10-centro-datos.png'});
 await page.getByLabel('¿Quién opera esta PC?').selectOption('Jaruska');
 await page.getByRole('button',{name:/Avisos internos/}).click();
 await page.getByRole('dialog').getByRole('button',{name:'Recibido',exact:true}).waitFor();
 await page.getByRole('dialog').screenshot({path:output+'/11-recibir-aviso.png'});
 if(errors.length)throw new Error('Errores de la interfaz: '+errors.join('; '));
 await context.close();
 await writeFile(output+'/procedencia.json',JSON.stringify({web_version:'1.3.0',extension_version:'1.2.1',source:'Aplicación real sobre D1 local aislada; todos los contactos y registros son de demostración.',generated_at:new Date().toISOString(),token_included:false},null,2)+'\n');
 console.log('11 capturas de capacitación generadas con datos sintéticos, sin errores de interfaz.');
}finally{await browser.close();runtime.close();}

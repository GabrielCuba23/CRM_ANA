import {mkdir,readFile,writeFile,cp} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {startRuntime,client} from '../tests/runtime.mjs';
import {peruDay} from '../shared/planning.js';

if(!existsSync('dist/index.html'))throw new Error('Primero ejecuta npm run build.');
const output='store/materiales';await mkdir(output+'/capturas',{recursive:true});
const runtime=await startRuntime(8798),api=client(runtime);
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
let operator='Acxel';
async function save(action,payload){const r=await api('sync',{action,payload,operator_name:operator});if(r.status!==200)throw new Error(r.value.error||'No se pudo preparar la demostración local.');}
try{
 await save('UPDATE_MEMBERS',{members:['Operador demo','Coordinadora demo']});operator='Operador demo';
 const spaces=[
  {id:'demo-sede',name:'[Demo] Coordinación de Sede Central',org_unit:'Sede Central',status:'Pendiente',role:'Contacto de demostración',assignees:['Operador demo']},
  {id:'demo-ala',name:'[Demo] Mesa de coordinación ALA',org_unit:'ALA',status:'Urgente',role:'Seguimiento institucional de ejemplo',assignees:['Coordinadora demo']},
  {id:'demo-prensa',name:'[Demo] Equipo de comunicaciones',org_unit:'Prensa',status:'En elaboración',role:'Coordinación de actividades de ejemplo',assignees:['Operador demo','Coordinadora demo']}
 ];
 for(const [index,s] of spaces.entries())await save('UPSERT_SPACE',{...s,phone_or_group_id:s.id,cut_code:'CUT-DEMO-00'+(index+1),doc_ref:'Documento de demostración '+(index+1)});
 await save('ADD_NOTE',{id:'nota-demo',space_id:'demo-sede',content:'Registro de demostración: se coordinó la revisión del documento y la fecha de entrega.'});
 const tomorrow=peruDay(Date.now()+86400000),month=peruDay(Date.now()).slice(0,7);
 for(const [index,stage] of ['Por hacer','En proceso','En revisión','Completado'].entries())await save('UPSERT_TASK',{
  id:'tarea-demo-'+index,space_id:spaces[index%spaces.length].id,title:['Validar informe de ejemplo','Preparar propuesta de coordinación','Revisar documento de referencia','Registrar acuerdos de la reunión'][index],
  assignee:index%2?'Coordinadora demo':'Operador demo',due_date:tomorrow,stage,done:stage==='Completado',source_text:'Información sintética para ilustrar el funcionamiento del CRM.',source_type:'Texto'
 });
 await save('UPSERT_EVENT',{id:'evento-demo-1',title:'[Demo] Reunión de coordinación',datetime:month+'-15T15:00:00.000Z',end_datetime:month+'-15T16:00:00.000Z',space_id:'demo-sede',description:'Ejemplo de evento vinculado a un contacto y su CUT.',participants:'Operador demo y Coordinadora demo',location:'Sala de demostración',status:'Realizada'});
 await save('UPSERT_EVENT',{id:'evento-demo-2',title:'[Demo] Revisión de agenda compartida',datetime:month+'-25T15:00:00.000Z',end_datetime:month+'-25T16:30:00.000Z',description:'Ejemplo de evento general del equipo, sin contacto obligatorio.',participants:'Equipo de demostración',status:'Realizada'});

 const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1});const page=await context.newPage();
 await page.goto(runtime.base);await page.getByLabel('Token de acceso del equipo').fill(runtime.token);await page.getByRole('button',{name:'Entrar al espacio de trabajo'}).click();await page.getByLabel('¿Quién opera esta PC?').selectOption('Operador demo');
 await page.locator('.space-card').first().waitFor();await page.screenshot({path:output+'/capturas/01-directorio.png'});
 const nav=page.getByRole('navigation',{name:'Navegación principal'});
 await nav.getByRole('button',{name:'Tareas',exact:true}).click();await page.getByRole('heading',{name:'Tareas del equipo'}).waitFor();await page.getByRole('button',{name:'Tablero Kanban',exact:true}).click();await page.screenshot({path:output+'/capturas/02-tareas-kanban.png'});
 await nav.getByRole('button',{name:'Agenda',exact:true}).click();await page.getByRole('heading',{name:'Agenda del equipo'}).waitFor();await page.screenshot({path:output+'/capturas/03-agenda.png'});
 await context.close();

 const promo=await browser.newPage({viewport:{width:440,height:280},deviceScaleFactor:1});
 const logo=(await readFile('src/assets/ana-logo.png')).toString('base64');
 await promo.setContent(`<!doctype html><html lang="es"><head><meta charset="utf-8"></head><body style="margin:0;box-sizing:border-box;width:440px;height:280px;padding:22px 28px;background:#17345e;font-family:Arial,sans-serif;color:white"><div style="background:white;border-radius:10px;width:182px;padding:10px 12px"><img alt="Autoridad Nacional del Agua" src="data:image/png;base64,${logo}" style="display:block;width:158px;height:auto"></div><h1 style="margin:18px 0 6px;font-size:28px;line-height:1.12;letter-spacing:-.5px">CRM & Agenda Cloud</h1><p style="margin:0;font-size:15px;color:#dce7fa">Coordinación institucional</p><p style="margin:18px 0 0;font-size:12px;color:#c2d5f4">Contactos · Tareas · Agenda · Avisos internos</p></body></html>`);
 await promo.locator('img').evaluate(img=>img.decode());await promo.screenshot({path:output+'/imagen-promocional-440x280.png'});await promo.close();
 await cp('extension/icons/icon-128.png',output+'/icono-128.png');
 const listing=await readFile('store/FICHA_TIENDA.md','utf8');
 function section(name){const start=listing.indexOf('## '+name+'\n');if(start<0)throw new Error('Falta la sección '+name);const rest=listing.slice(start+name.length+4);return rest.split('\n## ')[0].trim()+'\n';}
 for(const [name,heading] of [['nombre.txt','Nombre'],['descripcion-breve.txt','Descripción breve'],['descripcion-completa.txt','Descripción completa'],['proposito-unico.txt','Propósito único'],['justificacion-permisos.txt','Justificación de permisos'],['revision-tecnica.txt','Arquitectura para la revisión técnica'],['datos-y-privacidad.txt','Datos y privacidad']])await writeFile(output+'/'+name,section(heading));
 await writeFile(output+'/privacidad-url.txt','https://crm-whatsapp-ana.pages.dev/privacy.html\n');
 await writeFile(output+'/LEEME.txt',`MATERIAL PARA CHROME WEB STORE\n\nEste ZIP contiene imágenes y textos; no es el paquete de la extensión.\nEn Nuevo elemento de Chrome Web Store sube crm-ana-extension.zip directamente.\n\nCapturas: 1280 x 800 píxeles. Muestran la aplicación web real del CRM, vinculada al panel de la extensión, con datos sintéticos en una D1 local aislada. No contienen conversaciones, teléfonos reales ni datos institucionales de producción. No se presentan como capturas de WhatsApp ni de la carga real de una extensión en este entorno.\n\nImagen promocional pequeña: 440 x 280 píxeles. Icono: 128 x 128 píxeles.\n\nFicha y permisos: copia los textos en los campos correspondientes de la consola. El publicador y correo verificado se configuran con la cuenta Google del administrador.\n\nVisibilidad prevista: No listada. La publicación requiere completar los formularios, acceso de prueba si Google lo solicita y revisión de Google. No está publicada por el hecho de preparar este material.\n\nPolítica de privacidad: https://crm-whatsapp-ana.pages.dev/privacy.html\n`);
 const extension=await readFile('artifacts/crm-ana-extension.zip');
 await writeFile(output+'/procedencia.json',JSON.stringify({extension_version:'1.2.1',extension_sha256:createHash('sha256').update(extension).digest('hex'),data:'Datos sintéticos de demostración; no producción',screenshots:{width:1280,height:800},promo:{width:440,height:280},generated_at:new Date().toISOString()},null,2)+'\n');
 console.log('Material preparado con tres capturas reales de la web, datos sintéticos y textos de ficha.');
}finally{await browser.close();runtime.close();}

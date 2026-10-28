import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {chromium} from 'playwright';
import {startRuntime,client} from './runtime.mjs';
const runtime=await startRuntime(8795),api=client(runtime),cloud='https://crm-whatsapp-ana.pages.dev',extensionOrigin='chrome-extension://abcdefghijklmnopabcdefghijklmnop';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),headless:true,args:['--no-sandbox']});
const ctx=await browser.newContext({viewport:{width:420,height:1000},permissions:['clipboard-read','clipboard-write'],acceptDownloads:true});
let waitForCloud=true,newRelease=false;const page=await ctx.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
try{
 const panel=await fetch(runtime.base+'/panel.html'),web=await fetch(runtime.base+'/'),version=await fetch(runtime.base+'/version.json');
 assert.match(panel.headers.get('content-security-policy'),/frame-ancestors chrome-extension:/);assert.equal(panel.headers.get('x-frame-options'),null);
 assert.match(web.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.equal(web.headers.get('x-frame-options'),'DENY');
 assert.match(version.headers.get('cache-control'),/no-store/);assert.equal((await fetch(runtime.base+'/ruta-inexistente')).status,404);
 await api('sync',{action:'UPSERT_SPACE',operator_name:'Acxel',payload:{id:'panel-contact',name:'Jaruska',phone_or_group_id:'51987654321',assignees:['Acxel']}});
 await ctx.addInitScript(({base,cloud})=>{
  if(location.origin===base){
   localStorage.setItem('ana.operator','Acxel');localStorage.setItem('ana.signature','false');sessionStorage.setItem('ana.token','no-debe-cruzar');
   let listener;const key='activeWhatsAppChat:7';
   window.chrome={windows:{getCurrent:async()=>({id:7})},storage:{local:{get:async()=>({}),set:async value=>{window.savedPreferences=value.panelPreferences;}},session:{get:async()=>({[key]:{rawTitle:'Jaruska',tabId:22}})},onChanged:{addListener:fn=>{listener=fn;}}},tabs:{query:async()=>[{id:22}],sendMessage:async()=>{}}};
   window.emitContext=(value,area='session')=>listener({[key]:{newValue:value}},area);
  }else if(location.origin===cloud){
   window.contextMessages=[];window.addEventListener('message',event=>{if(event.data?.type==='CONTEXT')window.contextMessages.push(event.data);});
  }
 },{base:runtime.base,cloud});
 await page.route(runtime.base+'/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  const files={'/shell-test':'index.html','/shell.js':'shell.js','/protocol.js':'protocol.js','/shell.css':'shell.css','/ana-logo.png':'ana-logo.png'};
  if(!files[path])return route.continue();
  const ext=files[path].split('.').at(-1),type={html:'text/html',js:'application/javascript',css:'text/css',png:'image/png'}[ext];
  await route.fulfill({status:200,contentType:type,body:await readFile('extension-dist/'+files[path])});
 });
 await ctx.route(cloud+'/**',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(waitForCloud&&['/panel','/panel.html'].includes(url.pathname))return route.fulfill({contentType:'text/html',body:'<p>Esperando despliegue de prueba</p>'});
  if(newRelease&&url.pathname==='/version.json')return route.fulfill({json:{version:'1.2.1',build:'prueba-nuevo-despliegue'}});
  const headers={...request.headers()};delete headers.host;delete headers['content-length'];
  const response=await fetch(runtime.base+url.pathname+url.search,{method:request.method(),headers,body:request.method()==='POST'?request.postData():undefined});
  const responseHeaders=Object.fromEntries(response.headers);delete responseHeaders['content-length'];delete responseHeaders['content-encoding'];
  if(['/panel','/panel.html'].includes(url.pathname)){
   // Solo el arnés HTTP simulado necesita retirar frame-ancestors; se comprueba arriba la política real.
   responseHeaders['content-security-policy']=responseHeaders['content-security-policy'].split(',').filter(value=>!value.includes('frame-ancestors')).join(',');
  }
  await route.fulfill({status:response.status,headers:responseHeaders,body:Buffer.from(await response.arrayBuffer())});
 });
 await page.goto(runtime.base+'/shell-test');
 await page.waitForFunction(()=>document.getElementById('crm').contentWindow!==null);
 await page.evaluate(()=>{
  const frame=document.getElementById('crm'),channel=new URL(frame.src).searchParams.get('bridge');
  for(const origin of ['https://ajeno.example','https://crm-whatsapp-ana.pages.dev.evil.example'])window.dispatchEvent(new MessageEvent('message',{origin,source:frame.contentWindow,data:{bridge:'ANA_CRM_PANEL',version:1,type:'READY',channel}}));
 });
 assert.equal(await page.locator('#crm').isVisible(),false,'Un origen ajeno no abre el canal');
 assert.equal(await page.evaluate(()=>sessionStorage.getItem('ana.token')),null,'El contenedor elimina el token de la sesión antigua');
 waitForCloud=false;page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Recargar',exact:true}).click();
 const frame=page.frameLocator('#crm');await frame.getByLabel('Token de acceso del equipo').waitFor();
 await page.waitForFunction(()=>document.getElementById('connection').textContent==='En línea');
 const embedded=page.frames().find(f=>f.url().startsWith(cloud+'/panel'));
 await embedded.waitForFunction(()=>window.contextMessages.length>0);
 const context=await embedded.evaluate(()=>window.contextMessages.at(-1));assert.equal(JSON.stringify(context).includes('no-debe-cruzar'),false);assert.equal(context.payload.chat.rawTitle,'Jaruska');
 async function receive(data){await embedded.evaluate(({data,origin})=>window.dispatchEvent(new MessageEvent('message',{origin,source:parent,data})),{data,origin:extensionOrigin});}
 await receive(context);
 await frame.getByLabel('Token de acceso del equipo').fill(runtime.token);await frame.getByRole('button',{name:'Entrar al espacio de trabajo'}).click();
 await frame.locator('.chat-context strong').getByText('Jaruska',{exact:true}).waitFor();
 assert.equal(await frame.getByLabel('¿Quién opera esta PC?').inputValue(),'Acxel');
 await frame.getByLabel('Nueva nota').fill('Borrador que no debe perderse al detectar versión');
 newRelease=true;await embedded.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await frame.getByRole('button',{name:'Actualizar CRM',exact:true}).waitFor();assert.equal(await frame.getByLabel('Nueva nota').inputValue(),'Borrador que no debe perderse al detectar versión');
 page.once('dialog',dialog=>dialog.dismiss());await frame.getByRole('button',{name:'Actualizar CRM',exact:true}).click();assert.equal(await frame.getByLabel('Nueva nota').inputValue(),'Borrador que no debe perderse al detectar versión');
 await frame.getByRole('button',{name:'Registrar nota',exact:true}).click();await frame.getByText('Borrador que no debe perderse al detectar versión',{exact:true}).waitFor();
 await page.evaluate(()=>window.emitContext({rawTitle:'Otro chat',tabId:22}));
 await embedded.waitForFunction(()=>window.contextMessages.at(-1).payload.chat?.rawTitle==='Otro chat');
 const next=await embedded.evaluate(()=>window.contextMessages.at(-1));await receive(next);await frame.locator('.chat-context strong').getByText('Otro chat',{exact:true}).waitFor();
 await page.evaluate(()=>window.emitContext(null));await embedded.waitForFunction(()=>window.contextMessages.at(-1).payload.chat===null);await receive(await embedded.evaluate(()=>window.contextMessages.at(-1)));
 assert.equal(await frame.locator('.chat-context').count(),0);
 await frame.getByRole('button',{name:'Centro de datos',exact:true}).click();const downloading=page.waitForEvent('download');await frame.getByRole('button',{name:'Descargar .xlsx',exact:true}).click();const file=await downloading;assert.ok((await stat(await file.path())).size>1000);
 await page.evaluate(({cloud})=>{
  const frame=document.getElementById('crm'),channel=new URL(frame.src).searchParams.get('bridge');
  window.dispatchEvent(new MessageEvent('message',{origin:cloud,source:frame.contentWindow,data:{bridge:'ANA_CRM_PANEL',version:1,type:'PREFERENCES',channel,payload:{operator:'Fernando',token:'no-guardar',signature:'false'}}}));
 },{cloud});
 assert.deepEqual(await page.evaluate(()=>window.savedPreferences),{operator:'Fernando',signature:'false'});
 newRelease=false;const navigated=page.waitForEvent('framenavigated',{predicate:f=>f===embedded});
 page.once('dialog',dialog=>dialog.accept());await frame.getByRole('button',{name:'Actualizar CRM',exact:true}).click();await navigated;
 await embedded.waitForFunction(()=>window.contextMessages?.length>0);
 await receive(await embedded.evaluate(()=>window.contextMessages.at(-1)));
 await frame.getByRole('button',{name:'Entrar al espacio de trabajo'}).or(frame.getByRole('heading',{name:'Directorio de espacios',exact:true})).waitFor();
 if(await frame.getByLabel('Token de acceso del equipo').count()){
  await frame.getByLabel('Token de acceso del equipo').fill(runtime.token);await frame.getByRole('button',{name:'Entrar al espacio de trabajo'}).click();
 }
 await frame.getByRole('heading',{name:'Directorio de espacios',exact:true}).waitFor();
 await frame.locator('.space-card').filter({hasText:'Jaruska'}).click();await frame.getByText('Borrador que no debe perderse al detectar versión',{exact:true}).waitFor();
 assert.equal(await embedded.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:'artifacts/panel-cloud.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('Panel cloud: encabezados, aislamiento, migración sin token, detección, aviso/recarga de actualización, conservación de borrador/datos, preferencias limitadas, descarga y ancho 420 px aprobados. Extensión real pendiente de Chrome externo.');
}catch(error){console.error(JSON.stringify({errors,frames:await Promise.all(page.frames().map(async f=>({url:f.url(),heading:await f.locator('h1').allTextContents().catch(()=>[])})))}));await page.screenshot({path:'artifacts/panel-failure.png',fullPage:true});throw error;}finally{await browser.close();runtime.close();}

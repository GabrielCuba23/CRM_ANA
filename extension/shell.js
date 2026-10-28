import {CLOUD_ORIGIN,envelope,matchesEnvelope,cleanChat,cleanPreferences} from './protocol.js';
const frame=document.getElementById('crm'),loading=document.getElementById('loading'),connection=document.getElementById('connection'),explanation=document.getElementById('explanation'),retry=document.getElementById('retry');
let channel='',key='',chat=null,ready=false,timer,failed=false,windowId=null;
let preferences={};
try{
 preferences=cleanPreferences({operator:localStorage.getItem('ana.operator'),signature:localStorage.getItem('ana.signature')});
 sessionStorage.removeItem('ana.token');
}catch{}
function sendContext(){if(ready)frame.contentWindow.postMessage(envelope('CONTEXT',channel,{chat,preferences}),CLOUD_ORIGIN);}
function unavailable(){
 if(ready)return;
 failed=true;connection.textContent='Sin conectar';loading.hidden=false;frame.hidden=true;retry.hidden=false;
 explanation.textContent='No se pudo abrir el CRM. Comprueba tu conexión y que Cloudflare haya terminado el despliegue. Si el navegador bloquea el almacenamiento del panel, abre el CRM en una pestaña.';
}
function connect(){
 clearTimeout(timer);channel=crypto.randomUUID();ready=false;failed=false;frame.hidden=true;loading.hidden=false;retry.hidden=true;connection.textContent='Conectando';
 explanation.textContent='La aplicación se carga desde Cloudflare. Tus datos siguen guardados en la nube.';
 frame.src=`${CLOUD_ORIGIN}/panel?bridge=${channel}`;
 timer=setTimeout(unavailable,25000);
}
window.addEventListener('message',event=>{
 if(event.origin!==CLOUD_ORIGIN||event.source!==frame.contentWindow)return;
 if(matchesEnvelope(event.data,'READY',channel)){
  clearTimeout(timer);ready=true;failed=false;loading.hidden=true;frame.hidden=false;connection.textContent=navigator.onLine?'En línea':'Sin conexión';sendContext();readContext();
 }else if(ready&&matchesEnvelope(event.data,'PREFERENCES',channel)){
  preferences={...preferences,...cleanPreferences(event.data.payload)};
  chrome.storage.local.set({panelPreferences:preferences}).catch(()=>{});
 }
});
chrome.storage.onChanged.addListener((changes,area)=>{
 if(area!=='session'||!key||!changes[key])return;
 const value=cleanChat(changes[key].newValue??null);if(value!==undefined){chat=value;sendContext();}
});
async function readContext(){
 try{
  if(windowId===null)windowId=(await chrome.windows.getCurrent()).id;key='activeWhatsAppChat:'+windowId;
  const values=await chrome.storage.session.get(key);chat=cleanChat(values[key]??null)??null;sendContext();
  const tabs=await chrome.tabs.query({active:true,windowId});
  if(tabs[0]?.id)await chrome.tabs.sendMessage(tabs[0].id,{type:'CRM_READ_CHAT'});
 }catch{chat=null;sendContext();}
}
function reload(){if(window.confirm('Se recargará el CRM. Guarda primero los formularios que tengas abiertos. ¿Continuar?'))connect();}
document.getElementById('reload').addEventListener('click',reload);retry.addEventListener('click',connect);
window.addEventListener('offline',()=>{connection.textContent='Sin conexión';});
window.addEventListener('online',()=>{if(failed)connect();else if(ready)connection.textContent='En línea';});
const contextTimer=setInterval(()=>{if(ready&&!document.hidden)readContext();},4000);
window.addEventListener('pagehide',()=>{clearTimeout(timer);clearInterval(contextTimer);},{once:true});
async function start(){
 try{const stored=await chrome.storage.local.get('panelPreferences');preferences={...preferences,...cleanPreferences(stored.panelPreferences)};}catch{}
 connect();readContext();
}
start();

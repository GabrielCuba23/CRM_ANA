import test from 'node:test';
import assert from 'node:assert/strict';
import {createPanelBridge} from '../src/panelBridge.js';
import {envelope,cleanChat} from '../extension/protocol.js';
const channel='29d1f8ab-e6ce-456a-9e77-26187968437e',origin='chrome-extension://abcdefghijklmnopabcdefghijklmnop';
function setup(){
 let receive;const sent=[],values=new Map(),parent={postMessage:(...v)=>sent.push(v)};
 const win={parent,location:{href:`https://crm-whatsapp-ana.pages.dev/panel.html?bridge=${channel}`,pathname:'/panel.html'},localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},addEventListener:(name,fn)=>{receive=fn;},removeEventListener:()=>{}};
 const bridge=createPanelBridge(win,win.localStorage);
 return {bridge,sent,values,win,dispatch:(data,from=origin,source=parent)=>receive({data,origin:from,source})};
}
test('canal de panel verifica origen, ventana padre, protocolo, nonce y datos; READY no contiene credenciales',()=>{
 const f=setup();let chat;f.bridge.subscribe(value=>{chat=value;});
 assert.deepEqual(f.sent,[[envelope('READY',channel),'*']]);
 const data=envelope('CONTEXT',channel,{chat:{rawTitle:'Jaruska',tabId:2},preferences:{operator:'Acxel',token:'privado'}});
 for(const [message,from,source] of [[data,'https://otro.example',f.win.parent],[data,origin,{}],[{...data,version:2},origin,f.win.parent],[{...data,channel:'otro'},origin,f.win.parent],[{...data,payload:{chat:{rawTitle:'x'.repeat(301),tabId:2}}},origin,f.win.parent]]){
  f.dispatch(message,from,source);assert.equal(chat,null);assert.equal(f.values.size,0);
 }
 f.dispatch(data);assert.deepEqual(chat,{rawTitle:'Jaruska',tabId:2});assert.equal(f.values.get('ana.operator'),'Acxel');assert.equal(f.values.has('ana.token'),false);
 f.dispatch(envelope('CONTEXT',channel,{chat:{rawTitle:'Fuente privilegiada',tabId:3}}),origin,null);assert.equal(chat.rawTitle,'Fuente privilegiada');
 f.dispatch(envelope('CONTEXT',channel,{chat:{rawTitle:'Falsificación',tabId:3}}),'https://ajeno.example',null);assert.equal(chat.rawTitle,'Fuente privilegiada');
 f.values.set('ana.operator','Jaruska');f.dispatch(data);assert.equal(f.values.get('ana.operator'),'Jaruska','No se pisa la elección cloud posterior');
 f.dispatch(envelope('CONTEXT',channel,{chat:null}));assert.equal(chat,null);
 f.bridge.savePreferences({operator:'Fernando',signature:'false',token:'privado',command:'ejecutar'});
 assert.deepEqual(f.sent.at(-1),[envelope('PREFERENCES',channel,{operator:'Fernando',signature:'false'}),origin]);
});
test('página normal o nonce inválido no habilitan comunicación con la extensión',()=>{
 for(const path of ['https://crm-whatsapp-ana.pages.dev/','https://crm-whatsapp-ana.pages.dev/panel.html?bridge=no-valido']){
  const f=setup(),url=new URL(path);f.win.location={href:path,pathname:url.pathname};
  assert.equal(createPanelBridge(f.win).enabled,false);
 }
 assert.equal(cleanChat({rawTitle:'a',tabId:'2'}),undefined);
});

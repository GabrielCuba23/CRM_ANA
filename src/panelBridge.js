import {envelope,matchesEnvelope,validChannel,extensionOrigin,cleanChat,cleanPreferences} from '../extension/protocol.js';
import {localStore} from './storage.js';
export function createPanelBridge(win,storage=localStore){
 const channel=new URL(win.location.href).searchParams.get('bridge');
 const enabled=win.parent!==win&&['/panel','/panel.html'].includes(win.location.pathname)&&validChannel(channel);
 let origin='',chat=null,pendingPreferences={},retry;
 const listeners=new Set();
 function receive(event){
  if(!enabled||(event.source!==win.parent&&event.source!==null)||!extensionOrigin(event.origin)||(origin&&origin!==event.origin)||!matchesEnvelope(event.data,'CONTEXT',channel))return;
  const next=cleanChat(event.data.payload?.chat);if(next===undefined)return;
  origin=event.origin;chat=next;
  if(retry)win.clearInterval(retry);
  try{
  if(storage.getItem('ana.cloud-migrated')!=='1'){
   const prefs=cleanPreferences(event.data.payload?.preferences);
   if(!storage.getItem('ana.operator')&&prefs.operator)storage.setItem('ana.operator',prefs.operator);
   if(storage.getItem('ana.signature')===null&&prefs.signature)storage.setItem('ana.signature',prefs.signature);
   storage.setItem('ana.cloud-migrated','1');
  }
  }catch{}
  if(Object.keys(pendingPreferences).length)win.parent.postMessage(envelope('PREFERENCES',channel,pendingPreferences),origin);
  for(const listener of listeners)listener(chat);
 }
 function refresh(){if(enabled)win.parent.postMessage(envelope('READY',channel),origin||'*');}
 if(enabled){win.addEventListener('message',receive);refresh();if(win.setInterval)retry=win.setInterval(refresh,3000);}
 return {enabled,refresh,getChat:()=>chat,savePreferences(value){
  pendingPreferences={...pendingPreferences,...cleanPreferences(value)};
  if(enabled&&origin)win.parent.postMessage(envelope('PREFERENCES',channel,pendingPreferences),origin);
 },subscribe(listener){listeners.add(listener);listener(chat);return()=>listeners.delete(listener);},dispose(){win.removeEventListener('message',receive);if(retry)win.clearInterval(retry);listeners.clear();}};
}
export const panelBridge=typeof window==='undefined'?null:createPanelBridge(window);
export const isPanel=Boolean(panelBridge?.enabled);

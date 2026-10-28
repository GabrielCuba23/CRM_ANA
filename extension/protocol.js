export const CLOUD_ORIGIN='https://crm-whatsapp-ana.pages.dev';
export const BRIDGE_NAME='ANA_CRM_PANEL';
export const BRIDGE_VERSION=1;
export function extensionOrigin(value){return typeof value==='string'&&/^chrome-extension:\/\/[a-p]{32}$/.test(value);}
export function validChannel(value){return typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);}
export function envelope(type,channel,payload){return {bridge:BRIDGE_NAME,version:BRIDGE_VERSION,type,channel,...(payload===undefined?{}:{payload})};}
export function matchesEnvelope(value,type,channel){return value?.bridge===BRIDGE_NAME&&value.version===BRIDGE_VERSION&&value.type===type&&value.channel===channel&&validChannel(channel);}
export function cleanChat(value){
 if(value===null)return null;
 if(!value||typeof value.rawTitle!=='string'||value.rawTitle.length>300||!Number.isSafeInteger(value.tabId)||value.tabId<0)return undefined;
 return {rawTitle:value.rawTitle,tabId:value.tabId};
}
export function cleanPreferences(value){
 const result={};
 if(typeof value?.operator==='string'&&value.operator.length<=80)result.operator=value.operator;
 if(value?.signature==='true'||value?.signature==='false')result.signature=value.signature;
 return result;
}

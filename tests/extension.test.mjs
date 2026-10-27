import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
test('Manifest V3 usa solo recursos locales, permisos acotados y URL válida',()=>{
 const manifest=JSON.parse(readFileSync('extension/manifest.json'));
 assert.equal(manifest.manifest_version,3);assert.deepEqual(manifest.host_permissions,['https://web.whatsapp.com/*']);
 assert.ok(manifest.optional_host_permissions.includes('https://*/*'));assert.equal(manifest.side_panel.default_path,'index.html');
 for(const file of [manifest.background.service_worker,...manifest.content_scripts.flatMap(c=>c.js)])assert.ok(existsSync('extension/'+file));
 assert.equal(manifest.content_security_policy.extension_pages.includes("script-src 'self'"),true);
 assert.deepEqual(manifest.content_scripts[0].matches,['https://web.whatsapp.com/*']);
});
test('service worker solo acepta títulos de content scripts de WhatsApp y limita su longitud',async()=>{
 let listener,stored;
 const context={
   URL,console,
   chrome:{
     sidePanel:{setPanelBehavior:()=>Promise.resolve()},
     storage:{local:{set:value=>{stored=value;return Promise.resolve();},get:()=>Promise.resolve({})}},
     runtime:{onMessage:{addListener:fn=>{listener=fn;}}},
     tabs:{onActivated:{addListener:()=>{}},onRemoved:{addListener:()=>{}}}
   }
 };
 vm.runInNewContext(readFileSync('extension/background.js','utf8'),context);
 listener({type:'WA_ACTIVE_CHAT_CHANGED',payload:{rawTitle:'No permitido'}},{url:'https://sitio-ajeno.example/',tab:{id:1,active:true,windowId:7}});
 assert.equal(stored,undefined);
 listener({type:'WA_ACTIVE_CHAT_CHANGED',payload:{rawTitle:'Pestaña inactiva'}},{url:'https://web.whatsapp.com/',tab:{id:2,active:false,windowId:7}});
 assert.equal(stored,undefined);
 listener({type:'WA_ACTIVE_CHAT_CHANGED',payload:{rawTitle:'a'.repeat(500)}},{url:'https://web.whatsapp.com/',tab:{id:1,active:true,windowId:7}});
 assert.equal(stored['activeWhatsAppChat:7'].rawTitle.length,300);assert.equal(stored['activeWhatsAppChat:7'].tabId,1);
});

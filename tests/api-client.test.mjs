import test from 'node:test';
import assert from 'node:assert/strict';
import {request,ApiError,hasPendingWrites} from '../src/api.js';
test('identifica escrituras en curso para impedir recargar durante un guardado',async t=>{
 let finish;t.mock.method(globalThis,'fetch',()=>new Promise(resolve=>{finish=()=>resolve(Response.json({ok:true}));}));
 const saving=request('https://example.com','token-de-prueba','sync',{action:'ADD_NOTE'});
 assert.equal(hasPendingWrites(),true);finish();await saving;assert.equal(hasPendingWrites(),false);
});

test('se recupera de una consulta HTML 503 y devuelve los datos del segundo intento',async t=>{
 let calls=0;
 t.mock.method(globalThis,'fetch',async()=>++calls===1
  ?new Response('<html>Servicio temporalmente no disponible</html>',{status:503,headers:{'Retry-After':'0','Content-Type':'text/html'}})
  :Response.json({spaces:[],members:['Acxel']}));
 const result=await request('https://example.com','token-de-prueba','sync');
 assert.equal(calls,2);assert.deepEqual(result.members,['Acxel']);
});
test('no reintenta una escritura cuando no se pudo confirmar su resultado',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return new Response('<html>Bad gateway</html>',{status:502});});
 await assert.rejects(request('https://example.com','token-de-prueba','sync',{action:'ADD_NOTE',payload:{}}),error=>{
  assert.ok(error instanceof ApiError);assert.equal(error.status,502);assert.match(error.message,/HTTP 502/);assert.match(error.message,/confirmar el guardado/);return true;
 });assert.equal(calls,1);
});
test('una página HTML 200 identifica configuración incorrecta y no se reintenta',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return new Response('<html>Web de inicio</html>',{status:200});});
 await assert.rejects(request('https://example.com','token-de-prueba','sync'),/HTTP 200.*Pages Functions/);
 assert.equal(calls,1);
});
test('respeta rechazos de autorización y el tiempo de espera largo del servidor',async t=>{
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return new Response('<html>Forbidden</html>',{status:403});});
 await assert.rejects(request('https://example.com','token-de-prueba','sync'),/HTTP 403/);assert.equal(calls,1);
 t.mock.restoreAll();calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return new Response('Busy',{status:429,headers:{'Retry-After':'60'}});});
 await assert.rejects(request('https://example.com','token-de-prueba','sync'),/HTTP 429/);assert.equal(calls,1);
});
test('la cancelación no vuelve a enviar la consulta ni incluye credenciales en errores',async t=>{
 const controller=new AbortController();controller.abort();let calls=0;
 t.mock.method(globalThis,'fetch',async()=>{calls++;return Response.json({});});
 await assert.rejects(request('https://example.com','token-confidencial','sync',undefined,{signal:controller.signal}),{name:'AbortError'});
 assert.equal(calls,0);
 t.mock.restoreAll();t.mock.method(globalThis,'fetch',async()=>new Response('<html>secret-token from upstream</html>',{status:502,headers:{'Retry-After':'60'}}));
 await assert.rejects(request('https://example.com','token-confidencial','sync'),error=>{assert.ok(!error.message.includes('token-confidencial'));assert.ok(!error.message.includes('secret-token'));return true;});
});

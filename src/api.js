let pendingWrites=0;
export function hasPendingWrites(){return pendingWrites>0;}
export function apiOrigin(value){
 const url=new URL(value);
 if(url.protocol!=='https:' && !(url.protocol==='http:' && ['localhost','127.0.0.1'].includes(url.hostname)))throw new Error('La API requiere HTTPS; HTTP solo se permite en localhost.');
 if(url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new Error('Indica solo el origen de Pages, sin rutas ni credenciales.');
 return url.origin;
}
export class ApiError extends Error {
 constructor(message,{status=0,code='request_failed',retryable=false,retryAfter=0}={}){
  super(message);this.name='ApiError';this.status=status;this.code=code;this.retryable=retryable;this.retryAfter=retryAfter;
 }
}
const TRANSIENT_STATUS=new Set([408,429,500,502,503,504,520,521,522,523,524,525,526]);
function resourceName(path){
 const route=path.split('?')[0];
 return {notices:'los avisos internos',sync:'la agenda',presence:'la presencia del equipo',backup:'la copia de seguridad',powerbi:'el reporte'}[route]||'los datos';
}
function retryDelay(response){
 const raw=response.headers.get('Retry-After');if(!raw)return 1000;
 const seconds=Number(raw);if(Number.isFinite(seconds))return Math.max(0,seconds*1000);
 const date=Date.parse(raw);return Number.isFinite(date)?Math.max(0,date-Date.now()):1000;
}
function pause(ms,signal){
 return new Promise((resolve,reject)=>{
  signal?.throwIfAborted();
  const done=()=>{signal?.removeEventListener('abort',abort);resolve();};
  const timer=setTimeout(done,ms);
  const abort=()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);reject(signal.reason);};
  signal?.addEventListener('abort',abort,{once:true});
 });
}
export async function request(base,token,path,body,options={}){
 const writing=body!==undefined&&path.split('?')[0]!=='presence';
 if(writing)pendingWrites++;
 try{return await requestData(base,token,path,body,options);}finally{if(writing)pendingWrites--;}
}
async function requestData(base,token,path,body,{signal}={}){
 const reading=body===undefined,resource=resourceName(path);
 for(let attempt=0;attempt<(reading?2:1);attempt++){
  signal?.throwIfAborted();
  try{
   const response=await fetch(`${base}/api/${path}`,{
    method:reading?'GET':'POST',headers:{'X-Team-Token':token,...(!reading?{'Content-Type':'application/json'}:{})},
    body:reading?undefined:JSON.stringify(body),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000),cache:'no-store'
   });
   const text=await response.text();let result;
   try{result=JSON.parse(text);}catch{
    const hint=response.status===200
     ?'El servidor devolvió una página web en lugar de datos. Comprueba la dirección y el despliegue de Pages Functions.'
     :response.status===401||response.status===403
      ?'La conexión fue rechazada. Revisa el acceso a la aplicación y vuelve a iniciar sesión.'
      :response.status===429
       ?'El servicio limitó temporalmente las solicitudes. Espera antes de actualizar.'
       :'El servicio devolvió una respuesta temporal o incompleta. Vuelve a actualizar.';
    throw new ApiError(`No se pudo consultar ${resource} (HTTP ${response.status}). ${hint}${reading?'':' No se pudo confirmar el guardado; actualiza antes de repetirlo.'}`,
     {status:response.status,code:'non_json_response',retryable:TRANSIENT_STATUS.has(response.status),retryAfter:retryDelay(response)});
   }
   if(!response.ok)throw new ApiError(typeof result?.error==='string'?result.error:`No se pudo consultar ${resource} (HTTP ${response.status}).`,
    {status:response.status,code:'http_error',retryable:TRANSIENT_STATUS.has(response.status),retryAfter:retryDelay(response)});
   if(!result||typeof result!=='object'||Array.isArray(result))throw new ApiError(`Respuesta inválida al consultar ${resource} (HTTP ${response.status}).`,{status:response.status,code:'invalid_response'});
   return result;
  }catch(error){
   if(signal?.aborted)throw signal.reason;
   const failure=error instanceof ApiError?error:new ApiError(
    error.name==='TimeoutError'?`El servicio tardó demasiado en responder al consultar ${resource}. Vuelve a actualizar.`
     :`No se pudo conectar con ${resource}. Revisa tu conexión y vuelve a actualizar.${reading?'':' Comprueba si se guardó antes de repetir la operación.'}`,
    {code:error.name==='TimeoutError'?'timeout':'network_error',retryable:true,retryAfter:1000});
   if(reading&&attempt===0&&failure.retryable&&failure.retryAfter<=5000){await pause(failure.retryAfter,signal);continue;}
   throw failure;
  }
 }
}
export function downloadJson(data,name){
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export async function clipboard(text){await navigator.clipboard.writeText(text);}

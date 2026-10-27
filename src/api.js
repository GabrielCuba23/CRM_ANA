export const isExtension=globalThis.location.protocol==='chrome-extension:';
export function apiOrigin(value){
 const url=new URL(value);
 if(url.protocol!=='https:' && !(url.protocol==='http:' && ['localhost','127.0.0.1'].includes(url.hostname)))throw new Error('La API requiere HTTPS; HTTP solo se permite en localhost.');
 if(url.username||url.password||url.search||url.hash||url.pathname!=='/')throw new Error('Indica solo el origen de Pages, sin rutas ni credenciales.');
 return url.origin;
}
export async function request(base,token,path,body){
 const response=await fetch(`${base}/api/${path}`,{method:body?'POST':'GET',headers:{'X-Team-Token':token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000),cache:'no-store'});
 let result;try{result=await response.json();}catch{throw new Error('La API no respondió JSON. Comprueba la URL y que Pages Functions esté desplegado.');}
 if(!response.ok)throw new Error(result.error||`Error HTTP ${response.status}`);
 return result;
}
export function downloadJson(data,name){
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export async function clipboard(text){await navigator.clipboard.writeText(text);}

import {spawn,spawnSync} from 'node:child_process';
import {readFile,mkdir} from 'node:fs/promises';
import {ensureLocalConfig} from '../scripts/local.mjs';
export async function startRuntime(port=8789){
 await ensureLocalConfig();
 const file=await readFile('.dev.vars','utf8');
 const token=file.match(/^TEAM_TOKEN=["']?([^"'\r\n]+)["']?/m)?.[1];
 if(!token)throw new Error('Primero ejecuta python3 scripts/local-secret.py');
 const state=`.wrangler/test-${process.pid}-${port}`;
 const env={...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:'.wrangler/logs',XDG_CONFIG_HOME:process.cwd()+'/.wrangler/xdg'};
 const localId=(await readFile('wrangler.local.toml','utf8')).match(/^database_id\s*=\s*"([^"]+)"/m)[1];
 const bin=['node_modules/wrangler/bin/wrangler.js'];
 const migrated=spawnSync(process.execPath,[...bin,'d1','migrations','apply','crm_ana_db','--local','--config','wrangler.local.toml','--persist-to',state],{env,encoding:'utf8'});
 if(migrated.status!==0)throw new Error('Migración de prueba fallida: '+migrated.stderr);
 const child=spawn(process.execPath,[...bin,'pages','dev','dist','--d1','DB='+localId,'--port',String(port),'--inspector-port','0','--persist-to',state],{env,stdio:['ignore','pipe','pipe'],detached:true});
 let logs='';const collect=chunk=>{logs=(logs+chunk.toString()).slice(-5000);};child.stdout.on('data',collect);child.stderr.on('data',collect);
 const base=`http://127.0.0.1:${port}`;
 const close=()=>{try{process.kill(-child.pid,'SIGTERM');}catch{}};
 process.once('exit',close);
 for(let n=0;n<120;n++){
  try{const res=await fetch(base+'/api/sync',{headers:{'X-Team-Token':token}});if(res.ok){await mkdir('artifacts',{recursive:true});return {base,token,close};}}catch{}
  if(child.exitCode!==null)throw new Error('Servidor local terminó: '+logs);
  await new Promise(resolve=>setTimeout(resolve,500));
 }
 close();throw new Error('El servidor no quedó listo: '+logs.replaceAll(token,'[redactado]'));
}
export function client(runtime){return async(path='sync',body,token=runtime.token)=>{
 const r=await fetch(`${runtime.base}/api/${path}`,{method:body?'POST':'GET',headers:{'X-Team-Token':token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 const value=await r.json();return {status:r.status,value,headers:r.headers};
};}

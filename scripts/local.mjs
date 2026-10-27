import {access,readFile,writeFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export async function ensureLocalConfig(){
 const file='wrangler.local.toml';
 try{await access(file);}catch{
  const source=await readFile('wrangler.toml','utf8');
  const content=source.replace(/^database_id\s*=.*\n/gm,'').replace('database_name = "crm_ana_db"','database_name = "crm_ana_db"\ndatabase_id = "'+randomUUID()+'"');
  await writeFile(file,content,{flag:'wx'});
 }
 return file;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const config=await ensureLocalConfig();
 const localId=(await readFile(config,'utf8')).match(/^database_id\s*=\s*"([^"]+)"/m)[1];
 const command=process.argv[2];
 const args=command==='migrate'?['d1','migrations','apply','crm_ana_db','--local','--config',config]:command==='serve'?['pages','dev','dist','--d1','DB='+localId,'--port','8788']:null;
 if(!args)throw new Error('Usa node scripts/local.mjs migrate o serve');
 const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args,...process.argv.slice(3)],{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:'.wrangler/logs',XDG_CONFIG_HOME:process.cwd()+'/.wrangler/xdg'}});
 child.on('exit',code=>{process.exitCode=code??1;});
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
}

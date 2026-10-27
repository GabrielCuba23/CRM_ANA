import {readFile,writeFile} from 'node:fs/promises';
const id=process.argv[2];
if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id||'')) {
  console.error('Indica el UUID real de D1 como argumento. Se obtiene con npx wrangler d1 create crm_ana_db.');
  process.exit(1);
}
let text=await readFile('wrangler.toml','utf8');
text=text.replace(/^database_id\s*=.*\n/gm,'');
text=text.replace('database_name = "crm_ana_db"','database_name = "crm_ana_db"\ndatabase_id = "'+id+'"');
await writeFile('wrangler.toml',text);
console.log('UUID de D1 registrado. Configura también el secreto TEAM_TOKEN en Cloudflare Pages.');

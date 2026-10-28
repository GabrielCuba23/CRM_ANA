import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,statSync} from 'node:fs';
export const buildInputs=['src','shared','extension','public','server','functions','migrations','package.json','package-lock.json','index.html','panel.html','vite.config.js','scripts/build-extension.mjs','scripts/build-fingerprint.mjs'];
export function sourceFingerprint(){
 const paths=[];
 function walk(path){if(statSync(path).isDirectory())for(const name of readdirSync(path))walk(path+'/'+name);else paths.push(path);}
 for(const path of buildInputs)walk(path);
 const hash=createHash('sha256');
 for(const path of paths.sort())hash.update(path+'\0'+createHash('sha256').update(readFileSync(path)).digest('hex')+'\n');
 return hash.digest('hex');
}

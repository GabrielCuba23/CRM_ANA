import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
await rm('extension-dist',{recursive:true,force:true});
await mkdir('extension-dist',{recursive:true});
await cp('dist/index.html','extension-dist/index.html');
await cp('dist/assets','extension-dist/assets',{recursive:true});
await cp('extension','extension-dist',{recursive:true});
const html=await readFile('extension-dist/index.html','utf8');
await writeFile('extension-dist/index.html',html.replaceAll(' crossorigin',''));
console.log('Extensión autocontenida creada en extension-dist/');

import {cp,mkdir,rm} from 'node:fs/promises';
await rm('extension-dist',{recursive:true,force:true});
await mkdir('extension-dist',{recursive:true});
await cp('extension','extension-dist',{recursive:true});
await cp('src/assets/ana-logo.png','extension-dist/ana-logo.png');
console.log('Contenedor cloud de la extensión creado en extension-dist/ (sin React empaquetado).');

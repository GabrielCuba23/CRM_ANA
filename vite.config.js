import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {sourceFingerprint} from './scripts/build-fingerprint.mjs';
const build=randomUUID(),version=JSON.parse(readFileSync(new URL('./package.json',import.meta.url))).version;
export default defineConfig({
 plugins:[react(),{name:'ana-release',generateBundle(){this.emitFile({type:'asset',fileName:'version.json',source:JSON.stringify({build,version,sourceHash:sourceFingerprint(),generated_at:new Date().toISOString()})});}}],
 define:{__APP_BUILD__:JSON.stringify(build)},
 base:'./',server:{proxy:{'/api':'http://127.0.0.1:8788'}},
 build:{sourcemap:false,rollupOptions:{input:{web:'index.html',panel:'panel.html'}}}
});

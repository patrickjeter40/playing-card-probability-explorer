import { build } from 'esbuild';
const built=await build({entryPoints:['scripts/playtest-sanity.ts'],bundle:true,platform:'node',format:'esm',write:false,target:'node22'});
await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].contents).toString('base64'));

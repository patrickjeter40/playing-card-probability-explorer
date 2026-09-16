import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('../', import.meta.url)));
const entries=process.argv.includes('--card-count-only')?['scripts/card-count-analysis.ts']:['scripts/report-analysis.ts','scripts/card-count-analysis.ts'];
for(const entry of entries){
  const result = await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,target:'node22'});
  await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].contents).toString('base64'));
}

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
const root=resolve(import.meta.dirname,'..');
for (const file of ['scripts/build.mjs','scripts/serve.mjs','src/sw.js']) execFileSync(process.execPath,['--check',resolve(root,file)],{stdio:'inherit'});
const src=await readFile(resolve(root,'src/app.ts'),'utf8');
for(const [what,regex] of [
  ['untrusted HTML insertion',/\.innerHTML\s*=|\.outerHTML\s*=/],
  ['dynamic execution',/\beval\s*\(|\bnew\s+Function\s*\(/],
  ['AI API calls',/api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com/],
  ['GitHub write requests',/fetch\([\s\S]{0,240}method\s*:\s*['\"](?:POST|PUT|PATCH|DELETE)/],
]) if(regex.test(src))throw new Error('Lint blocked: '+what);
console.log('Static safety lint PASS (not ESLint)');

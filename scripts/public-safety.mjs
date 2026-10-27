import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
const root=new URL('..', import.meta.url).pathname;
const bannedNames=/(^\.env(?:\.|$)|\.(?:pem|key|p12)$|secret|service.account|credential|backup.*\.json)/i;
const ignored=new Set(['node_modules', 'dist', '.git', '.vercel', '__pycache__', 'test-results', 'playwright-report']);
const paths=[];
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){const path=join(dir,item.name);if(item.isDirectory()){if(!ignored.has(item.name))await walk(path);}else if(item.isFile())paths.push(path);}}
await walk(root);
for(const p of paths){const name=relative(root,p);if(bannedNames.test(name))throw new Error('Sensitive-looking file blocked: '+name);const info=await stat(p);if(info.size>1_000_000)throw new Error('Unexpectedly large source file: '+name);if(/\.(?:ts|js|mjs|json|yml|yaml|md|html|css|bat|webmanifest|svg)$/i.test(p)){const data=await readFile(p,'utf8');if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(data)||/gh[pousr]_[A-Za-z0-9]{30,}/.test(data))throw new Error('Possible secret in '+name);}}
console.log('PUBLIC REPO SAFETY PASS: '+paths.length+' source files checked');

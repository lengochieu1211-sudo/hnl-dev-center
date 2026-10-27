import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';
test('PWA never caches arbitrary same-origin URLs',async()=>{const source=await readFile(new URL('../src/sw.js',import.meta.url),'utf8');assert.match(source,/allowed=new Set/);assert.match(source,/if\(url\.search \|\| !allowed\.has\(basename\)\)return/);});
test('public repository ignores sensitive material',async()=>{const ignore=await readFile(new URL('../.gitignore',import.meta.url),'utf8');for(const expected of ['.env','*.pem','*backup*.json','dist/','node_modules/'])assert.ok(ignore.includes(expected),expected);});

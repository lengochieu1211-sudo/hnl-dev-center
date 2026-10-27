import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFile} from 'node:fs/promises';

test('iframe preview retains requested logical viewport',async()=>{
 const source=await readFile(new URL('../src/app.ts',import.meta.url),'utf8');
 assert.match(source,/iframe\.style\.width=`\$\{width\}px`/);
 assert.match(source,/iframe\.style\.transform=`scale\(\$\{scale\}\)`/);
});
test('iframe preview has always-visible real-site fallback',async()=>{
 const source=await readFile(new URL('../src/app.ts',import.meta.url),'utf8');
 assert.match(source,/web-preview-fallback/);
 assert.match(source,/fallback\.target='_blank'/);
 assert.match(source,/fallback\.rel='noopener noreferrer'/);
 assert.match(source,/setAttribute\('sandbox','allow-scripts allow-forms allow-popups'\)/);
 assert.doesNotMatch(source,/allow-same-origin/);
});
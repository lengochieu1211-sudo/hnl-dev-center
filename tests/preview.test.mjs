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

test('external Web URL becomes a real browser link on input',async()=>{
 const source=await readFile(new URL('../src/app.ts',import.meta.url),'utf8');
 const html=await readFile(new URL('../src/index.html',import.meta.url),'utf8');
 assert.match(source,/preview-url'\)\.addEventListener\('input',updateWebPreviewLink\)/);
 assert.match(source,/link\.href=url;link\.hidden=false/);
 assert.match(source,/link\.removeAttribute\('href'\);link\.hidden=true/);
 assert.match(html,/id="open-web-external" class="primary-button" target="_blank" rel="noopener noreferrer" hidden/);
 assert.ok(html.indexOf('class="panel real-preview-panel"') < html.indexOf('class="preview-stage"'));
});

test('QLTC distinguishes PROD, DEV, DEV BACKUP with read-only production',async()=>{
 const app=await readFile(new URL('../src/app.ts',import.meta.url),'utf8');
 const html=await readFile(new URL('../src/index.html',import.meta.url),'utf8');
 for(const name of ['prod','dev','dev-backup']) assert.match(app,new RegExp("id:'"+name+"'"));
 assert.match(app,/hostingSite:'hnl-qltc-dev-backup'/);
 assert.match(app,/branch:null,firebaseProject:null,hostingSite:'hnl-qltc-dev-backup'/);
 assert.match(app,/PROD chỉ được mở tab riêng, không nhúng/);
 assert.match(html,/id="qltc-environments"/);
 assert.match(html,/id="preview-environment"/);
});

test('legacy saved tasks remain valid when environment field is absent',async()=>{
 const app=await readFile(new URL('../src/app.ts',import.meta.url),'utf8');
 assert.match(app,/t.environment === undefined \|\| isQltcEnv\(t.environment\)/);
 assert.match(app,/environment:isQltcEnv\(t.environment\)\?t.environment:undefined/);
 assert.match(app,/t.environment\?\?'dev'/);
});

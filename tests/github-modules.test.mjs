import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const app=await readFile(new URL('../src/app.ts',import.meta.url),'utf8');
const html=await readFile(new URL('../src/index.html',import.meta.url),'utf8');
test('GitHub modules always verify fresh branch SHA, not the baseline string',()=>{
 assert.match(app,/const sha=await verifyBuildHead\(target\)/);
 assert.match(app,/response\.ref!==expected\|\|!validSha\(response\.object\?\.sha\)/);
 assert.match(app,/v\.head_sha===sha/);
});
test('artifact list is tied to the workflow id and commit SHA and expired artifacts cannot link to download',()=>{
 assert.match(app,/a\.workflow_run\?\.id===run\.id&&a\.workflow_run\?\.head_sha===sha/);
 assert.match(app,/if\(!a\.expired\)/);
 assert.match(app,/Mở Actions để tải ZIP/);
 assert.doesNotMatch(app, /a\.archive_download_url|artifact\.archive_download_url/);
});
test('QLTC DEV BACKUP is never treated as an inferred deploy HEAD',()=>{
 assert.match(app,/if\(!env\.branch\)return null/);
 assert.match(app,/DEV BACKUP: chưa có HEAD riêng/);
 assert.match(html,/DEV BACKUP – chưa có HEAD bản phát hành/);
});
test('issues do not silently include pull requests, and output is text only',()=>{
 assert.match(app,/!issue\.pull_request/);
 assert.match(app,/issue\.html_url===`https:\/\/github\.com\/\$\{repo\}\/issues\/\$\{issue\.number\}`/);
 assert.doesNotMatch(app,/\.innerHTML\s*=/);
});
test('the GitHub modules use only read endpoints',()=>{
 assert.match(app,/\/actions\/runs\?branch=/);
 assert.match(app,/\/actions\/runs\/\$\{run\.id\}\/artifacts/);
 assert.match(app,/\/issues\?state=/);
 assert.doesNotMatch(app,/method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)/);
});
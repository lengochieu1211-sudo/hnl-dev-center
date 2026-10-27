import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const app = await readFile(new URL('../src/app.ts', import.meta.url), 'utf8');
const html = await readFile(new URL('../src/index.html', import.meta.url), 'utf8');
test('no mutation endpoints or AI API keys', () => {
  assert.doesNotMatch(app, /api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com|firebase\.googleapis\.com/i);
  assert.doesNotMatch(app, /fetch\([^\n]*method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)/);
  assert.match(app, /api\.github\.com\/repos/);
});
test('correct project repositories and distinct HCF HCE branches', () => {
  assert.match(app, /lengochieu1211-sudo\/hnl-qltc/);
  assert.match(app, /research\/vxt-pro-v7-bootstrap/);
  assert.match(app, /research\/hce-pro-bootstrap/);
});
test('safe display and explicit preview limitations', () => {
  assert.doesNotMatch(app, /\.innerHTML\s*=/);
  assert.match(html, /không phải runtime thật/);
  assert.match(html, /không có kết nối ChatGPT\/Claude\/Gemini tự động/);
});

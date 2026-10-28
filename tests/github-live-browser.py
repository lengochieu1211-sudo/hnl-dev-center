"""Chromium smoke for public GitHub actions artifacts and issues; mocked GitHub data only.
No secrets, no PROD access, no claim of external end-to-end authentication.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'dist/index.html').read_text()
CSS=(ROOT/'dist/styles.css').read_text()
JS=(ROOT/'dist/app.js').read_text()
MOCK_JS=r"""
window.localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
window.fetch=async (url)=>{
 const full=String(url); const repo=full.includes('hnl-qltc')?'lengochieu1211-sudo/hnl-qltc':'lengochieu1211-sudo/hnl-cad-ai';
 const sha=repo.endsWith('hnl-qltc')?'d6effaf03a08a9879fa172a345992922916036d2':'83582296127306d846571010a43eb8e94edbedd1';
 const urlParts=full.split('git/ref/heads/');
 if(urlParts.length>1){const path=decodeURIComponent(urlParts[1]);const ref=path==='main'?'main':path;const head=ref==='main'?'57eea2b878e17da64d7a6191fda178eaff3b8488':sha;return {ok:true,json:async()=>({ref:'refs/heads/'+ref,object:{sha:head}})}};
 if(full.includes('/actions/runs/')&&full.includes('/artifacts'))return {ok:true,json:async()=>({artifacts:[
  {id:12,name:'HCF Setup AutoCAD2023',size_in_bytes:2198489,expired:false,expires_at:'2026-11-09T00:00:00Z',workflow_run:{id:40420766842,head_sha:sha}},
  {id:13,name:'WRONG SHA - must be hidden',size_in_bytes:100,expired:false,workflow_run:{id:40420766842,head_sha:'a'.repeat(40)}},
  {id:14,name:'Old artifact',size_in_bytes:100,expired:true,workflow_run:{id:40420766842,head_sha:sha}}
 ]})};
 if(full.includes('/actions/runs?'))return {ok:true,json:async()=>({workflow_runs:[
  {id:40420766842,name:'Beta CI HCF',head_sha:sha,status:'completed',conclusion:'success',html_url:`https://github.com/${repo}/actions/runs/40420766842`,created_at:'2026-10-26T00:00:00Z'},
  {id:40420000000,name:'Other SHA must be hidden',head_sha:'a'.repeat(40),status:'completed',conclusion:'success',html_url:`https://github.com/${repo}/actions/runs/40420000000`,created_at:'2026-10-26T00:00:00Z'}
 ]})};
 if(full.includes('/issues?'))return {ok:true,json:async()=>[
  {number:42,title:'Lỗi #42 HNL',state:'open',html_url:`https://github.com/${repo}/issues/42`,updated_at:'2026-10-27T00:00:00Z',labels:[{name:'bug'}]},
  {number:43,title:'DO NOT DISPLAY PR',state:'open',html_url:`https://github.com/${repo}/pull/43`,pull_request:{url:'https://api.github.com/...'}},
  {number:44,title:'<img src=x onerror=alert(1)>',state:'open',html_url:`https://github.com/${repo}/issues/44`}
 ]};
 return {ok:false,status:404,json:async()=>({})};
};
"""
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height in [(1440,900),(390,844),(360,800)]:
  ctx=browser.new_context(viewport={'width':width,'height':height});page=ctx.new_page();errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(HTML);page.add_style_tag(content=CSS);page.add_script_tag(content=MOCK_JS);page.add_script_tag(content=JS)
  if width<900: page.locator('#menu-toggle').click()
  page.locator('[data-page=builds]').click()
  page.locator('#build-project').select_option('hcf')
  page.locator('#refresh-builds').click()
  expect(page.locator('.build-run')).to_have_count(1)
  expect(page.locator('#build-summary')).to_contain_text('83582296127306d846571010a43eb8e94edbedd1')
  page.locator('.build-run button').click()
  expect(page.locator('.artifact-item')).to_have_count(2)
  assert 'WRONG SHA' not in page.locator('#build-results').inner_text()
  assert page.locator('.artifact-item a').count()==1 # expired does not link
  assert page.locator('.artifact-item a').first.get_attribute('href')=='https://github.com/lengochieu1211-sudo/hnl-cad-ai/actions/runs/40420766842'
  page.wait_for_timeout(200)
  page.screenshot(path=str(ROOT/f'github-builds-{width}x{height}.png'),full_page=True)
  page.locator('#build-project').select_option('qltc')
  page.locator('#build-environment').select_option('dev-backup')
  assert page.locator('#refresh-builds').is_disabled()
  expect(page.locator('#build-summary')).to_contain_text('chưa có HEAD riêng')
  page.locator('#build-environment').select_option('dev')
  assert page.locator('#refresh-builds').is_enabled()
  if width<900: page.locator('#menu-toggle').click()
  page.locator('[data-page=issues]').click()
  page.locator('#refresh-issues').click()
  expect(page.locator('.issue-row')).to_have_count(2)
  assert 'DO NOT DISPLAY PR' not in page.locator('#issues-results').inner_text()
  assert page.locator('#issues-results img').count()==0
  assert 'Lỗi #42' in page.locator('#issues-results').inner_text()
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),width
  assert not errors,(width,errors)
  page.wait_for_timeout(320) # sidebar close animation
  page.screenshot(path=str(ROOT/f'github-modules-{width}x{height}.png'),full_page=True)
  print('GITHUB MODULES BROWSER PASS',width,height)
  ctx.close()
 browser.close()
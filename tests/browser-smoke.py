"""Chromium component UI smoke using set_content because environment blocks all page navigation.
This does not replace hosted DEV browser Golden (network and real GitHub/Firebase)."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import json
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'dist/index.html').read_text()
CSS=(ROOT/'dist/styles.css').read_text()
JS=(ROOT/'dist/app.js').read_text()
BOOTSTRAP="""
window.__store=new Map();
Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>window.__store.get(k)||null,setItem:(k,v)=>window.__store.set(k,v),removeItem:k=>window.__store.delete(k)}});
Object.defineProperty(window,'crypto',{configurable:true,value:{randomUUID:()=>`12abcdef-1234-4234-abcd-${String(Math.random()).slice(2,14).padEnd(12,'0')}`,subtle:{digest:async()=>new Uint8Array(32).buffer}}});
window.fetch=async url=>{
 if(url.includes('actions/runs')){ const name=url.includes('hnl-qltc')?'d6effaf03a08a9879fa172a345992922916036d2':url.includes('hce-pro')?'a45fe6dcf9fca2172fed3a93ac14e6cf4f4f8ae8':'83582296127306d846571010a43eb8e94edbedd1';
  return {ok:true,json:async()=>({workflow_runs:[{id:123,name:'CI TEST',head_sha:name,status:'completed',conclusion:'success',html_url:url.includes('hnl-qltc')?'https://github.com/lengochieu1211-sudo/hnl-qltc/actions/runs/123':'https://github.com/lengochieu1211-sudo/hnl-cad-ai/actions/runs/123',created_at:'2026-10-27T00:00:00Z'}]})}; }
 const branch=url.includes('hnl-qltc')?'dev':url.includes('hce-pro-bootstrap')?'research/hce-pro-bootstrap':'research/vxt-pro-v7-bootstrap';
 const sha=branch==='dev'?'d6effaf03a08a9879fa172a345992922916036d2':branch.includes('hce')?'a45fe6dcf9fca2172fed3a93ac14e6cf4f4f8ae8':'83582296127306d846571010a43eb8e94edbedd1';
 return {ok:true,json:async()=>({ref:'refs/heads/'+branch,object:{sha}})};
};
"""
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for size in [(1920,1080),(1440,900),(1366,768),(1180,820),(820,1180),(390,844),(360,800)]:
        ctx=browser.new_context(viewport={'width':size[0],'height':size[1]},accept_downloads=True)
        page=ctx.new_page()
        errors=[]
        page.on('pageerror',lambda exc:errors.append(str(exc)))
        page.set_content(HTML,wait_until='domcontentloaded')
        page.add_style_tag(content=CSS)
        page.add_script_tag(content=BOOTSTRAP)
        page.add_script_tag(content=JS)
        page.wait_for_timeout(100)
        assert page.locator('.project-card').count()==3,(size,page.locator('.project-card').count(),errors)
        assert page.locator('#refresh-stamp').inner_text()=='3/3 nhánh xác minh trực tiếp'
        if size[0]<900: page.locator('#menu-toggle').click()
        page.locator('[data-page="tasks"]').first.click()
        page.locator('#task-title').fill('Kiểm tra preview responsive HCF')
        page.locator('#task-details').fill('Không thay đổi logic XC/XP/Ty')
        page.locator('#task-project').select_option('hcf')
        page.locator('button[type=submit]').click()
        assert page.locator('.task-row').count()==1,(size,errors)
        assert 'HEAD đã đọc trong phiên' in page.locator('#handoff-output').input_value()
        # retest status persistence and backup change
        page.locator('.task-actions select').select_option('Đang audit')
        assert page.locator('.task-actions select').input_value()=='Đang audit'
        if size[0]<900:page.locator('#menu-toggle').click()
        page.locator('[data-page="backup"]').click()
        with page.expect_download() as download_info:page.locator('#export-backup').click()
        downloaded=download_info.value
        assert downloaded.suggested_filename.startswith('HNL-DEV-CENTER-TASKS')
        target=ROOT/f'test-backup-{size[0]}.json'
        downloaded.save_as(str(target))
        original=json.loads(target.read_text())
        assert len(original['tasks'])==1 and original['tasks'][0]['status']=='Đang audit'
        # Invalid import never overwrites existing data.
        page.locator('#import-backup').set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':b'{"bad":1}'})
        assert page.locator('.task-row').count()==1
        incoming=dict(original)
        newer=dict(original['tasks'][0]);newer['id']='abcdefghijklmnop';newer['title']='Công việc từ máy khác'
        incoming['tasks']=[newer]
        page.locator('#import-backup').set_input_files({'name':'valid.json','mimeType':'application/json','buffer':json.dumps(incoming).encode()})
        expect(page.locator('#task-count')).to_contain_text('2 công việc')
        target.unlink()
        if size[0]<900:page.locator('#menu-toggle').click()
        page.locator('[data-page="ci"]').click()
        page.locator('#refresh-ci').click()
        page.wait_for_timeout(100)
        assert page.locator('.ci-run').count()==3,(size,errors)
        if size[0]<900:page.locator('#menu-toggle').click()
        page.locator('[data-page="preview"]').click()
        page.locator('#preview-device').select_option('iphone')
        page.locator('input[value="web"]').check()
        page.locator('#preview-url').fill('https://evil.com')
        page.locator('#load-web-preview').click()
        assert page.locator('.live-frame').count()==0
        page.locator('#preview-url').fill('https://hnlqltc.web.app')
        page.locator('#load-web-preview').click()
        assert page.locator('.live-frame').count()==1,(size,errors)
        page.locator('input[value="simulation"]').check()
        assert page.locator('#sim-title').count()==1
        page.screenshot(path=str(ROOT/f'preview-qa-{size[0]}x{size[1]}.png'),full_page=True)
        assert not errors,(size,errors)
        print(f'BROWSER SMOKE PASS {size[0]}x{size[1]}: projects, tasks, CI, URL allowlist, switching preview')
        ctx.close()
    browser.close()

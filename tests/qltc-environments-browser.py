"""Chromium browser smoke test, local static DOM only (not Firebase Runtime Golden)."""
import ast
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
tree=ast.parse((ROOT/'tests/browser-smoke.py').read_text())
BOOTSTRAP=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='BOOTSTRAP' for t in n.targets))
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height in [(1920,1080),(820,1180),(390,844),(360,800)]:
  context=browser.new_context(viewport={'width':width,'height':height})
  page=context.new_page(); errors=[]; page.on('pageerror',lambda e: errors.append(str(e)))
  page.set_content((ROOT/'dist/index.html').read_text())
  page.add_style_tag(content=(ROOT/'dist/styles.css').read_text())
  page.add_script_tag(content=BOOTSTRAP)
  page.add_script_tag(content=(ROOT/'dist/app.js').read_text())
  assert page.locator('#qltc-environments .environment-card').count()==3
  assert page.locator('#qltc-env-head-prod').inner_text().startswith('GitHub main HEAD')
  assert 'Không gán HEAD' in page.locator('#qltc-env-head-dev-backup').inner_text()
  if width<900:page.locator('#menu-toggle').click()
  page.locator('[data-page=preview]').click()
  page.locator('#preview-environment').select_option('prod')
  assert page.locator('#load-web-preview').is_disabled()
  page.locator('input[name=preview-mode][value=web]').check()
  assert page.locator('#open-web-external').get_attribute('href')=='https://hnlqltc.web.app/'
  page.locator('#preview-environment').select_option('dev')
  assert page.locator('#load-web-preview').is_enabled()
  assert page.locator('#open-web-external').get_attribute('href')=='https://hnl-qltc-dev.web.app/'
  page.locator('#preview-environment').select_option('dev-backup')
  assert page.locator('#open-web-external').get_attribute('href')=='https://hnl-qltc-dev-backup.web.app/'
  page.locator('#preview-app').select_option('hcf')
  assert page.locator('#preview-env-group').is_hidden()
  assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1')
  assert not errors,(width,height,errors)
  page.screenshot(path=str(ROOT/f'qltc-env-{width}x{height}.png'),full_page=True)
  print('QLTC ENV PASS',width,height)
  context.close()
 browser.close()

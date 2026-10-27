"""Local DOM regression of embedded Web Preview + fallback. Uses intercepted cross-origin content,
not live Firebase; does not claim Runtime Golden or cross-device browser compatibility."""
import ast
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'tests/browser-smoke.py').read_text()
tree=ast.parse(source)
bootstrap=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='BOOTSTRAP' for t in n.targets))
html=(ROOT/'dist/index.html').read_text()
css=(ROOT/'dist/styles.css').read_text()
js=(ROOT/'dist/app.js').read_text()
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for width,height in ((1920,1080),(1366,768),(820,1180),(390,844),(360,800)):
  context=browser.new_context(viewport={'width':width,'height':height})
  page=context.new_page();errors=[]
  page.on('pageerror',lambda ex:errors.append(str(ex)))
  page.set_content(html);page.add_style_tag(content=css);page.add_script_tag(content=bootstrap);page.add_script_tag(content=js)
  if width<900:page.locator('#menu-toggle').click()
  page.locator('[data-page=preview]').click()
  page.locator('#preview-device').select_option('desktop')
  page.locator('input[value=web]').check()
  page.locator('#preview-url').fill('https://test-preview.vercel.app/')
  assert page.locator('#open-web-external').is_visible(),(width,height)
  assert page.locator('#open-web-external').get_attribute('href')=='https://test-preview.vercel.app/'
  assert page.locator('#preview-url-status').is_visible()
  page.locator('#load-web-preview').click()
  assert page.locator('.live-frame').count()==1
  iframe=page.locator('.live-frame')
  assert iframe.evaluate('(e)=>e.style.width')=='1920px',(width,height)
  assert 'scale(' in iframe.evaluate('(e)=>e.style.transform'),(width,height)
  assert page.locator('.web-preview-fallback a').get_attribute('href')=='https://test-preview.vercel.app/'
  assert page.locator('#open-web-external').is_visible()
  assert page.locator('#open-web-external').get_attribute('target')=='_blank'
  page.locator('#preview-device').select_option('iphone')
  assert iframe.evaluate('(e)=>e.style.width')=='393px',(width,height)
  assert page.locator('.web-preview-fallback').is_visible()
  assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth+1'),(width,height)
  page.screenshot(path=str(ROOT/f'preview-web-fixed-{width}x{height}.png'),full_page=True)
  assert not errors,(width,height,errors)
  print(f'WEB PREVIEW PASS {width}x{height}: correct iframe viewport, visible new-tab fallback, no horizontal overflow')
  context.close()
 browser.close()
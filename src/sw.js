/* HNL Dev Center 0.3.1: static app shell only, never cache GitHub or user data. */
const CACHE='hnl-dev-center-app-v0.3.1';
const FILES=['./','./index.html','./styles.css','./app.js','./icon.svg','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(x=>x.startsWith('hnl-dev-center-app-')&&x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  // Never intercept future APIs, backup exports, auth sessions or URLs with query strings.
  const basename=url.pathname.slice(url.pathname.lastIndexOf('/')+1);
  const allowed=new Set(['', 'index.html', 'styles.css', 'app.js', 'icon.svg', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png']);
  if(url.search || !allowed.has(basename))return;
  event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));}return response;}).catch(()=>caches.match(request).then(cached=>cached||Response.error())));
});
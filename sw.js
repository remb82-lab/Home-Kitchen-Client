const CACHE='home-kitchen-client-central-20260826-v1';
const APP_SHELL=[
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './premium-client.css',
  './premium-client-adapter.js',
  './assets/branding/home-kitchen-mark.svg',
  './assets/icons/home-kitchen-ui.svg',
  './assets/images/placeholders/product-photo-placeholder-c-v2.1.svg'
];
const CATALOG='https://zdxfxyesdlwzpdknapti.supabase.co/functions/v1/client-kitchen?mode=catalog';

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);

  if(req.url===CATALOG){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{
        const fresh=await fetch(req);
        if(fresh.ok) await cache.put(req,fresh.clone());
        return fresh;
      }catch{
        const cached=await cache.match(req);
        if(cached) return cached;
        throw new Error('catalog-offline-unavailable');
      }
    })());
    return;
  }

  if(url.origin===self.location.origin){
    event.respondWith((async()=>{
      const cached=await caches.match(req);
      if(cached) return cached;
      try{
        const fresh=await fetch(req);
        if(fresh.ok){
          const cache=await caches.open(CACHE);
          await cache.put(req,fresh.clone());
        }
        return fresh;
      }catch{
        if(req.mode==='navigate') return (await caches.match('./index.html')) || Response.error();
        throw new Error('offline');
      }
    })());
  }
});

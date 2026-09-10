/* Home Kitchen client PWA service worker.
   Network-first by design: when online, the installed app always prefers the
   current deployed web version. Cached responses are offline fallback only. */
const CACHE_PREFIX = 'hk-client-pwa-';
const CACHE_NAME = `${CACHE_PREFIX}v16`;
const CORE_ASSETS = [
  './', './manifest.webmanifest', './app-shell.js', './app-shell.css',
  './premium-client-adapter.js', './premium-client.css', './client-repeat-order-adapter.js',
  './data/product-media.js', './runtime/client-runtime.js', './services/client-api.js',
  './security/turnstile.js', './contact/client-contact.js', './catalog/catalog-data.js',
  './catalog/product-card.js', './catalog/product-detail.js', './catalog/catalog-controller.js',
  './catalog/product-share.js', './cart/cart-view.js', './cart/cart-controller.js',
  './checkout/checkout-view.js', './checkout/checkout-controller.js', './orders/orders-view.js',
  './orders/orders-controller.js', './profile/profile-view.js', './profile/profile-controller.js',
  './app/app-state.js', './app/navigation-controller.js', './app/bootstrap.js',
  './assets/branding/home-kitchen-mark.svg'
];
self.addEventListener('install',(event)=>{event.waitUntil(caches.open(CACHE_NAME).then((cache)=>cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',(event)=>{event.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((key)=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map((key)=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',(event)=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    try{
      const response=await fetch(request);
      if(response&&response.ok)cache.put(request,response.clone()).catch(()=>{});
      return response;
    }catch(error){
      const cached=await cache.match(request);
      if(cached)return cached;
      if(request.mode==='navigate'){
        const shell=await cache.match('./');
        if(shell)return shell;
      }
      throw error;
    }
  })());
});

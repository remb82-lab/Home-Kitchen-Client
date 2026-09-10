import fs from 'node:fs/promises';

const read=(path)=>fs.readFile(path,'utf8');
const html=await read('index.html');
const api=await read('services/client-api.js');
const turnstile=await read('security/turnstile.js');
const checkout=await read('checkout/checkout-controller.js');
const cart=await read('cart/cart-controller.js');
const sw=await read('app-sw.js');
const builder=await read('scripts/build-public-pwa.sh');
const manifest=JSON.parse(await read('manifest.webmanifest'));

const requiredHtml=['Домашняя кухня','Каталог','Мои заказы','Профиль','security/turnstile.js','services/client-api.js','cart/cart-controller.js'];
for(const token of requiredHtml){if(!html.includes(token))throw new Error('Missing public UI/module token: '+token);}
if(!cart.includes('global.openCart=openCartModular'))throw new Error('Modular cart controller is not wired');
if(html.includes('client-kitchen?mode=order'))throw new Error('Legacy order endpoint must not ship');
if(html.includes('kg-only.js'))throw new Error('Legacy 1kg override must not ship');
if(html.includes('SUPABASE_SERVICE_ROLE_KEY')||html.includes('TURNSTILE_SECRET_KEY'))throw new Error('Server secrets must never be present in public HTML');

for(const token of ['/functions/v1/create-client-order','turnstile_token']){
  if(!api.includes(token))throw new Error('API boundary missing '+token);
}
for(const token of ['0x4AAAAAAEvNfqWeNAvsAKeB',"appearance:'interaction-only'","execution:'execute'",'.execute(widgetId)']){
  if(!turnstile.includes(token))throw new Error('Turnstile guard missing '+token);
}
if(turnstile.includes('TURNSTILE_SECRET_KEY'))throw new Error('Turnstile secret marker leaked into frontend');
if(!checkout.includes('HKTurnstile.getToken')||!checkout.includes('turnstile_token:turnstileToken'))throw new Error('Checkout is not protected by Turnstile');
if(!sw.includes("`${CACHE_PREFIX}v15`"))throw new Error('PWA cache was not rotated to v15');
if(!sw.includes('./security/turnstile.js'))throw new Error('PWA cache must include Turnstile guard');
if(!builder.includes('PUBLIC_CLIENT_RELEASE_CHECK: PASS'))throw new Error('Public package release gate missing');
if(manifest.display!=='standalone'||manifest.start_url!=='./'||manifest.scope!=='./')throw new Error('PWA manifest contract changed');

const requiredFiles=[
  'runtime/client-runtime.js','services/client-api.js','security/turnstile.js','contact/client-contact.js',
  'catalog/catalog-data.js','catalog/product-card.js','catalog/product-detail.js','catalog/catalog-controller.js','catalog/product-share.js',
  'cart/cart-view.js','cart/cart-controller.js','checkout/checkout-view.js','checkout/checkout-controller.js',
  'orders/orders-view.js','orders/orders-controller.js','profile/profile-view.js','profile/profile-controller.js',
  'app/app-state.js','app/navigation-controller.js','app/bootstrap.js','client-repeat-order-adapter.js',
  'assets/branding/home-kitchen-mark.svg'
];
for(const path of requiredFiles)await fs.access(path);

const endpoint='https://zdxfxyesdlwzpdknapti.supabase.co/rest/v1/rpc/get_client_catalog';
const key='sb_publishable_HYX-B3T2MBHe-QilI_7JQg_2WB3zOTW';
const response=await fetch(endpoint,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:'{}'});
if(!response.ok)throw new Error('Catalog RPC failed: '+response.status);
const catalog=await response.json();
if(!Array.isArray(catalog)||catalog.length===0)throw new Error('Published catalog must not be empty');
if(catalog.some((item)=>!Number(item.price_kg)))throw new Error('Every item must expose a valid 1kg price');
if(!catalog.some((item)=>Number(item.id)===50))throw new Error('Product 50 missing from catalog');

console.log('PASS: modular canonical client + Turnstile + live catalog; items='+catalog.length);

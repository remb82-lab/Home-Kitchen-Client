import fs from 'node:fs/promises';

const html = await fs.readFile('index.html', 'utf8');
const required = [
  'Домашняя кухня',
  'client-kitchen',
  'Каталог',
  'Корзина',
  'Мои заказы',
  'Оформление заказа'
];
for (const token of required) {
  if (!html.includes(token)) throw new Error(`Missing required UI token: ${token}`);
}
if (html.includes('SUPABASE_SERVICE_ROLE_KEY')) throw new Error('Service role secret marker must never be present in public client');

const css = await fs.readFile('premium-client.css', 'utf8');
const adapter = await fs.readFile('premium-client-adapter.js', 'utf8');
const placeholder = await fs.readFile('assets/images/placeholders/product-photo-placeholder-c-v2.1.svg', 'utf8');
const manifest = JSON.parse(await fs.readFile('manifest.webmanifest', 'utf8'));
const sw = await fs.readFile('sw-public.js', 'utf8');
const pages = await fs.readFile('.github/workflows/pages.yml', 'utf8');
const builder = await fs.readFile('scripts/build-public-pwa.sh', 'utf8');

for (const [name, content, token] of [
  ['premium-client.css', css, 'Premium Home Market'],
  ['premium-client-adapter.js', adapter, 'PRODUCT_PLACEHOLDER'],
  ['placeholder svg', placeholder, 'Фото скоро'],
  ['service worker', sw, 'home-kitchen-client-public-20260826-v2'],
  ['Pages workflow', pages, 'build-public-pwa.sh'],
  ['public PWA builder', builder, 'premium-client-adapter.js']
]) {
  if (!content.includes(token)) throw new Error(`${name} missing required token: ${token}`);
}
if (!pages.includes('path: _site')) throw new Error('Pages workflow must deploy _site');
if (pages.includes('HOME_KITCHEN_SOURCE_REPOSITORY') || pages.includes('remb82-lab/Home-Kitchen')) {
  throw new Error('Public Pages workflow must not depend on private Home-Kitchen checkout');
}
if (manifest.display !== 'standalone') throw new Error('PWA manifest display must be standalone');
if (manifest.start_url !== './' || manifest.scope !== './') throw new Error('PWA start_url/scope must remain relative for project Pages');

const endpoint = 'https://zdxfxyesdlwzpdknapti.supabase.co/functions/v1/client-kitchen?mode=catalog';
const r = await fetch(endpoint, { headers: { accept: 'application/json' } });
if (!r.ok) throw new Error(`Catalog API failed: ${r.status}`);
const data = await r.json();
if (!Array.isArray(data)) throw new Error('Catalog response must be an array');
console.log(`PASS: self-contained client PWA and catalog API OK; ${data.length} published items.`);

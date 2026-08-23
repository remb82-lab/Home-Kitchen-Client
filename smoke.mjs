import fs from 'node:fs/promises';

const html = await fs.readFile('index.html', 'utf8');
const required = [
  'Домашняя кухня',
  'client-kitchen',
  'Каталог',
  'Корзина',
  'Мои заказы',
  'Оформление заказа',
  'manifest.webmanifest',
  "navigator.serviceWorker.register('./sw.js')"
];
for (const token of required) {
  if (!html.includes(token)) throw new Error(`Missing required UI/PWA token: ${token}`);
}
if (html.includes('SUPABASE_SERVICE_ROLE_KEY')) throw new Error('Service role secret marker must never be present in public client');

const css = await fs.readFile('premium-client.css', 'utf8');
const adapter = await fs.readFile('premium-client-adapter.js', 'utf8');
const placeholder = await fs.readFile('assets/images/placeholders/product-photo-placeholder-c-v2.1.svg', 'utf8');
const pages = await fs.readFile('.github/workflows/pages.yml', 'utf8');
const manifest = JSON.parse(await fs.readFile('manifest.webmanifest', 'utf8'));
const sw = await fs.readFile('sw.js', 'utf8');
const icon = await fs.readFile('icon.svg', 'utf8');

for (const [name, content, token] of [
  ['premium-client.css', css, 'Premium Home Market'],
  ['premium-client-adapter.js', adapter, 'PRODUCT_PLACEHOLDER'],
  ['placeholder svg', placeholder, 'Фото скоро'],
  ['pages workflow', pages, 'premium-client.css'],
  ['service worker', sw, 'home-kitchen-client-v1'],
  ['service worker catalog cache', sw, 'client-kitchen?mode=catalog'],
  ['PWA icon', icon, '<svg']
]) {
  if (!content.includes(token)) throw new Error(`${name} missing required token: ${token}`);
}
if (!pages.includes('premium-client-adapter.js') || !pages.includes('path: _site')) {
  throw new Error('Pages workflow must inject premium assets and deploy _site');
}
if (manifest.display !== 'standalone') throw new Error('PWA manifest display must be standalone');
if (manifest.start_url !== './' || manifest.scope !== './') throw new Error('PWA manifest start_url/scope invalid for GitHub Pages');
if (!Array.isArray(manifest.icons) || !manifest.icons.length) throw new Error('PWA manifest must contain icons');

const endpoint = 'https://zdxfxyesdlwzpdknapti.supabase.co/functions/v1/client-kitchen?mode=catalog';
const r = await fetch(endpoint, { headers: { accept: 'application/json' } });
if (!r.ok) throw new Error(`Catalog API failed: ${r.status}`);
const data = await r.json();
if (!Array.isArray(data)) throw new Error('Catalog response must be an array');
console.log(`PASS: client structure, Premium UI, PWA assets and catalog API OK; ${data.length} published items.`);

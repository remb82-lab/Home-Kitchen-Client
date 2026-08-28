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
const kgOnly = await fs.readFile('kg-only.js', 'utf8');
const placeholder = await fs.readFile('assets/images/placeholders/product-photo-placeholder-c-v2.1.svg', 'utf8');
const manifest = JSON.parse(await fs.readFile('manifest.webmanifest', 'utf8'));
const sw = await fs.readFile('sw-public.js', 'utf8');
const pages = await fs.readFile('.github/workflows/pages.yml', 'utf8');
const builder = await fs.readFile('scripts/build-public-pwa.sh', 'utf8');

for (const [name, content, token] of [
  ['premium-client.css', css, 'Premium Home Market'],
  ['premium-client-adapter.js', adapter, 'PRODUCT_PLACEHOLDER'],
  ['kg-only.js mode marker', kgOnly, 'hk-kg-only-v1'],
  ['kg-only.js 1kg cart', kgOnly, 'grams:1000'],
  ['kg-only.js 1kg label', kgOnly, '1 кг'],
  ['placeholder svg', placeholder, 'Фото скоро'],
  ['service worker', sw, 'home-kitchen-client-public-20260828-v4'],
  ['service worker kg module', sw, './kg-only.js'],
  ['Pages workflow', pages, 'build-public-pwa.sh'],
  ['public PWA builder', builder, 'kg-only.js']
]) {
  if (!content.includes(token)) throw new Error(`${name} missing required token: ${token}`);
}
if (!pages.includes('path: _site')) throw new Error('Pages workflow must deploy _site');
if (pages.includes('HOME_KITCHEN_SOURCE_REPOSITORY') || pages.includes('remb82-lab/Home-Kitchen')) {
  throw new Error('Public Pages workflow must not depend on private Home-Kitchen checkout');
}
if (manifest.display !== 'standalone') throw new Error('PWA manifest display must be standalone');
if (manifest.start_url !== './' || manifest.scope !== './') throw new Error('PWA start_url/scope must remain relative for project Pages');

const photoMatch = html.match(/const PRODUCT_PHOTOS=(\{[^;]+\});/);
if (!photoMatch) throw new Error('PRODUCT_PHOTOS mapping is missing');
const productPhotos = JSON.parse(photoMatch[1]);
const photoEntries = Object.entries(productPhotos);
if (photoEntries.length !== 49) throw new Error(`Expected 49 product photo mappings, got ${photoEntries.length}`);
if (new Set(photoEntries.map(([, path]) => path)).size !== photoEntries.length) throw new Error('Duplicate product photo mapping detected');
if (productPhotos['1'] !== 'assets/images/products/syrniki-classic-premium.png') throw new Error('Approved classic syrniki mapping changed');
if (productPhotos['2'] !== 'assets/images/products/syrniki-raisins-vanilla.png') throw new Error('Approved raisins syrniki mapping changed');
if (!html.includes('new URL(relative,document.baseURI)')) throw new Error('Product asset paths must resolve against document.baseURI');
if (html.includes("p.image_url||p.photo_url||p.image")) throw new Error('Catalog must not render external product image URLs');
for (const [, relative] of photoEntries) {
  await fs.access(relative);
}
const productFiles = (await fs.readdir('assets/images/products')).filter((name) => name.endsWith('.png'));
if (productFiles.length !== 49) throw new Error(`Expected 49 local product PNG files, got ${productFiles.length}`);
if (!adapter.includes('phmImageError') || !adapter.includes('product image failed to load')) {
  throw new Error('Product image fallback must preserve explicit load-error diagnostics');
}

const endpoint = 'https://zdxfxyesdlwzpdknapti.supabase.co/functions/v1/client-kitchen?mode=catalog';
const r = await fetch(endpoint, { headers: { accept: 'application/json' } });
if (!r.ok) throw new Error(`Catalog API failed: ${r.status}`);
const data = await r.json();
if (!Array.isArray(data)) throw new Error('Catalog response must be an array');
const unmapped = data.filter((item) => !productPhotos[String(item.id)]);
if (unmapped.length) throw new Error('Published catalog items without local photos: ' + unmapped.map((item) => item.id).join(','));

if (data.some(item => !Number(item.price_kg))) throw new Error('Every published client item must expose a valid 1kg price');
console.log(`PASS: 1kg-only self-contained client PWA and catalog API OK; ${data.length} published items.`);

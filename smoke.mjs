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

const endpoint = 'https://zdxfxyesdlwzpdknapti.supabase.co/functions/v1/client-kitchen?mode=catalog';
const r = await fetch(endpoint, { headers: { accept: 'application/json' } });
if (!r.ok) throw new Error(`Catalog API failed: ${r.status}`);
const data = await r.json();
if (!Array.isArray(data)) throw new Error('Catalog response must be an array');
console.log(`PASS: client HTML structure OK; catalog API returned ${data.length} published items.`);

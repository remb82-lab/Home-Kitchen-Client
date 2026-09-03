#!/usr/bin/env bash
set -euo pipefail

OUTPUT_ROOT="${OUTPUT_ROOT:-_site}"

for path in \
  index.html \
  premium-client.css \
  premium-client-adapter.js \
  kg-only.js \
  manifest.webmanifest \
  icon.svg \
  sw-public.js \
  assets/images/placeholders/product-photo-placeholder-c-v2.1.svg \
  assets/products/syrniki-classic-premium.webp \
  assets/products/syrniki-raisins-vanilla.webp \
  assets/images/products/syrniki-poppy.webp; do
  test -s "$path"
done

rm -rf "$OUTPUT_ROOT"
mkdir -p "$OUTPUT_ROOT"
cp index.html premium-client.css premium-client-adapter.js kg-only.js manifest.webmanifest icon.svg "$OUTPUT_ROOT/"
cp sw-public.js "$OUTPUT_ROOT/sw.js"
rsync -a --exclude='images/products/*.png' assets/ "$OUTPUT_ROOT/assets/"
touch "$OUTPUT_ROOT/.nojekyll"

OUTPUT_ROOT="$OUTPUT_ROOT" python3 - <<'PY'
import os
from pathlib import Path

root = Path(os.environ['OUTPUT_ROOT'])
index = root / 'index.html'
html = index.read_text(encoding='utf-8')

head_parts = []
if 'rel="manifest"' not in html:
    head_parts.append('<link rel="manifest" href="./manifest.webmanifest">')
if 'rel="icon"' not in html:
    head_parts.append('<link rel="icon" href="./icon.svg" type="image/svg+xml">')
if 'premium-client.css' not in html:
    head_parts.append('<link rel="stylesheet" href="./premium-client.css">')
if 'name="apple-mobile-web-app-title"' not in html:
    head_parts.append('<meta name="apple-mobile-web-app-title" content="Домашняя кухня">')
if head_parts:
    if '</head>' not in html:
        raise SystemExit('missing </head> in public client index')
    html = html.replace('</head>', '\n'.join(head_parts) + '\n</head>', 1)

body_parts = []
if 'premium-client-adapter.js' not in html:
    body_parts.append('<script src="./premium-client-adapter.js" defer></script>')
if 'kg-only.js' not in html:
    body_parts.append('<script src="./kg-only.js" defer></script>')
if 'data-hk-pwa-registration' not in html:
    body_parts.append("""<script data-hk-pwa-registration>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('./sw.js').catch(function () {});
  });
}
</script>""")
if body_parts:
    if '</body>' not in html:
        raise SystemExit('missing </body> in public client index')
    html = html.replace('</body>', '\n'.join(body_parts) + '\n</body>', 1)

index.write_text(html, encoding='utf-8')
PY

test -s "$OUTPUT_ROOT/index.html"
test -s "$OUTPUT_ROOT/manifest.webmanifest"
test -s "$OUTPUT_ROOT/icon.svg"
test -s "$OUTPUT_ROOT/sw.js"
test -s "$OUTPUT_ROOT/premium-client.css"
test -s "$OUTPUT_ROOT/premium-client-adapter.js"
test -s "$OUTPUT_ROOT/kg-only.js"
test -s "$OUTPUT_ROOT/assets/images/placeholders/product-photo-placeholder-c-v2.1.svg"
test -s "$OUTPUT_ROOT/assets/products/syrniki-classic-premium.webp"
test -s "$OUTPUT_ROOT/assets/products/syrniki-raisins-vanilla.webp"
test -s "$OUTPUT_ROOT/assets/images/products/syrniki-poppy.webp"
test ! -e "$OUTPUT_ROOT/assets/images/products/syrniki-poppy.png"
grep -q 'client-kitchen' "$OUTPUT_ROOT/index.html"
grep -q 'rel="manifest"' "$OUTPUT_ROOT/index.html"
grep -q 'premium-client.css' "$OUTPUT_ROOT/index.html"
grep -q 'premium-client-adapter.js' "$OUTPUT_ROOT/index.html"
grep -q 'kg-only.js' "$OUTPUT_ROOT/index.html"
grep -q 'data-hk-pwa-registration' "$OUTPUT_ROOT/index.html"
grep -q '"display": "standalone"' "$OUTPUT_ROOT/manifest.webmanifest"
grep -q 'home-kitchen-client-public-20260903-v6' "$OUTPUT_ROOT/sw.js"
grep -q 'hk-kg-only-v1' "$OUTPUT_ROOT/kg-only.js"

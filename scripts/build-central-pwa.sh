#!/usr/bin/env bash
set -euo pipefail

SOURCE_ROOT="${SOURCE_ROOT:-_source/apps/client/web}"
OUTPUT_ROOT="${OUTPUT_ROOT:-_site}"

for path in \
  "$SOURCE_ROOT/index.html" \
  "$SOURCE_ROOT/premium-client.css" \
  "$SOURCE_ROOT/premium-client-adapter.js" \
  "$SOURCE_ROOT/premium-home-market.css" \
  "$SOURCE_ROOT/premium-home-market-adapter.js" \
  "$SOURCE_ROOT/assets/branding/home-kitchen-mark.svg" \
  "$SOURCE_ROOT/assets/icons/home-kitchen-ui.svg" \
  "$SOURCE_ROOT/assets/images/placeholders/product-photo-placeholder-c-v2.1.svg" \
  manifest.webmanifest icon.svg sw.js; do
  test -s "$path"
done

rm -rf "$OUTPUT_ROOT"
mkdir -p "$OUTPUT_ROOT"
rsync -a "$SOURCE_ROOT/" "$OUTPUT_ROOT/"
cp manifest.webmanifest icon.svg sw.js "$OUTPUT_ROOT/"
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
if 'name="theme-color"' not in html:
    head_parts.append('<meta name="theme-color" content="#1f5a47">')
if 'name="apple-mobile-web-app-capable"' not in html:
    head_parts.append('<meta name="apple-mobile-web-app-capable" content="yes">')
if 'name="apple-mobile-web-app-status-bar-style"' not in html:
    head_parts.append('<meta name="apple-mobile-web-app-status-bar-style" content="default">')
if 'name="apple-mobile-web-app-title"' not in html:
    head_parts.append('<meta name="apple-mobile-web-app-title" content="Домашняя кухня">')
if head_parts:
    if '</head>' not in html:
        raise SystemExit('missing </head> in client index')
    html = html.replace('</head>', '\n'.join(head_parts) + '\n</head>', 1)

if 'data-hk-pwa-registration' not in html:
    if '</body>' not in html:
        raise SystemExit('missing </body> in client index')
    registration = """<script data-hk-pwa-registration>\nif ('serviceWorker' in navigator) {\n  window.addEventListener('load', function () {\n    navigator.serviceWorker.register('./sw.js').catch(function () {});\n  });\n}\n</script>"""
    html = html.replace('</body>', registration + '\n</body>', 1)

index.write_text(html, encoding='utf-8')
PY

test -s "$OUTPUT_ROOT/index.html"
test -s "$OUTPUT_ROOT/manifest.webmanifest"
test -s "$OUTPUT_ROOT/icon.svg"
test -s "$OUTPUT_ROOT/sw.js"
grep -q './premium-client.css' "$OUTPUT_ROOT/index.html"
grep -q './premium-client-adapter.js' "$OUTPUT_ROOT/index.html"
grep -q 'rel="manifest"' "$OUTPUT_ROOT/index.html"
grep -q 'data-hk-pwa-registration' "$OUTPUT_ROOT/index.html"
grep -q 'home-kitchen-ui.svg' "$OUTPUT_ROOT/premium-client-adapter.js"
grep -q 'premium-home-market.css' "$OUTPUT_ROOT/sw.js"
grep -q 'assets/branding/home-kitchen-mark.svg' "$OUTPUT_ROOT/sw.js"
grep -q '"display": "standalone"' "$OUTPUT_ROOT/manifest.webmanifest"

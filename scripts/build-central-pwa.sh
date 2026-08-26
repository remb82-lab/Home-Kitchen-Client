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
  "$SOURCE_ROOT/manifest.webmanifest" \
  "$SOURCE_ROOT/app-shell.js" \
  "$SOURCE_ROOT/app-shell.css" \
  "$SOURCE_ROOT/app-sw.js" \
  "$SOURCE_ROOT/assets/branding/home-kitchen-mark.svg" \
  "$SOURCE_ROOT/assets/branding/home-kitchen-icon-512.svg" \
  "$SOURCE_ROOT/assets/branding/home-kitchen-maskable-512.svg" \
  "$SOURCE_ROOT/assets/icons/home-kitchen-ui.svg" \
  "$SOURCE_ROOT/assets/images/placeholders/product-photo-placeholder-c-v2.1.svg"; do
  test -s "$path"
done

rm -rf "$OUTPUT_ROOT"
mkdir -p "$OUTPUT_ROOT"

# The private Home-Kitchen client tree is the single source of truth for the PWA.
# Do not overlay a second deployment-repo manifest or service worker here.
rsync -a "$SOURCE_ROOT/" "$OUTPUT_ROOT/"
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
    head_parts.append('<link rel="icon" href="./assets/branding/home-kitchen-icon-512.svg" type="image/svg+xml">')
if 'name="theme-color"' not in html:
    head_parts.append('<meta name="theme-color" content="#0B4B31">')
if 'name="mobile-web-app-capable"' not in html:
    head_parts.append('<meta name="mobile-web-app-capable" content="yes">')
if 'name="apple-mobile-web-app-capable"' not in html:
    head_parts.append('<meta name="apple-mobile-web-app-capable" content="yes">')
if 'name="apple-mobile-web-app-status-bar-style"' not in html:
    head_parts.append('<meta name="apple-mobile-web-app-status-bar-style" content="default">')
if 'name="apple-mobile-web-app-title"' not in html:
    head_parts.append('<meta name="apple-mobile-web-app-title" content="Home Kitchen">')

if head_parts:
    if '</head>' not in html:
        raise SystemExit('missing </head> in client index')
    html = html.replace('</head>', '\n'.join(head_parts) + '\n</head>', 1)

index.write_text(html, encoding='utf-8')
PY

for path in \
  index.html \
  manifest.webmanifest \
  app-shell.js \
  app-shell.css \
  app-sw.js \
  assets/branding/home-kitchen-icon-512.svg \
  assets/branding/home-kitchen-maskable-512.svg; do
  test -s "$OUTPUT_ROOT/$path"
done

grep -q './premium-client.css' "$OUTPUT_ROOT/index.html"
grep -q './premium-client-adapter.js' "$OUTPUT_ROOT/index.html"
grep -q 'rel="manifest"' "$OUTPUT_ROOT/index.html"
grep -q 'home-kitchen-ui.svg' "$OUTPUT_ROOT/premium-client-adapter.js"
grep -q 'app-shell.js' "$OUTPUT_ROOT/premium-client-adapter.js"
grep -q "serviceWorker.register('./app-sw.js'" "$OUTPUT_ROOT/app-shell.js"
grep -q 'beforeinstallprompt' "$OUTPUT_ROOT/app-shell.js"
grep -q 'android-app://' "$OUTPUT_ROOT/app-shell.js"
grep -q 'await fetch(request)' "$OUTPUT_ROOT/app-sw.js"
grep -q '"display": "standalone"' "$OUTPUT_ROOT/manifest.webmanifest"
grep -q '"sizes": "512x512"' "$OUTPUT_ROOT/manifest.webmanifest"

if grep -q "serviceWorker.register('./sw.js'" "$OUTPUT_ROOT/index.html"; then
  echo 'legacy deployment service worker registration must not be injected' >&2
  exit 1
fi

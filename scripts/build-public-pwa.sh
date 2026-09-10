#!/usr/bin/env bash
set -euo pipefail

OUTPUT_ROOT="${OUTPUT_ROOT:-_site}"

required=(
  index.html
  premium-client.css
  premium-client-adapter.js
  app-shell.js
  app-shell.css
  app-sw.js
  manifest.webmanifest
  client-repeat-order-adapter.js
  data/product-media.js
  runtime/client-runtime.js
  services/client-api.js
  security/turnstile.js
  contact/client-contact.js
  catalog/catalog-data.js
  catalog/product-card.js
  catalog/product-detail.js
  catalog/catalog-controller.js
  catalog/product-share.js
  cart/cart-view.js
  cart/cart-controller.js
  checkout/checkout-view.js
  checkout/checkout-controller.js
  orders/orders-view.js
  orders/orders-controller.js
  profile/profile-view.js
  profile/profile-controller.js
  app/app-state.js
  app/navigation-controller.js
  app/bootstrap.js
  assets/branding/home-kitchen-mark.svg
)
for path in "${required[@]}"; do test -s "$path"; done

rm -rf "$OUTPUT_ROOT"
mkdir -p "$OUTPUT_ROOT"
cp index.html premium-client.css premium-client-adapter.js app-shell.js app-shell.css app-sw.js manifest.webmanifest client-repeat-order-adapter.js "$OUTPUT_ROOT/"
for dir in data runtime services security contact catalog cart checkout orders profile app assets; do
  cp -a "$dir" "$OUTPUT_ROOT/"
done
touch "$OUTPUT_ROOT/.nojekyll"
printf '{"source_sha":"%s","deployed_at":"%s","release":"sto75-turnstile"}\n' "${GITHUB_SHA:-local}" "$(date -u +%FT%TZ)" > "$OUTPUT_ROOT/deploy-meta.json"

# Release contract: canonical Pages must use the modular order gateway and Turnstile.
grep -q '/functions/v1/create-client-order' "$OUTPUT_ROOT/services/client-api.js"
grep -q '0x4AAAAAAEvNfqWeNAvsAKeB' "$OUTPUT_ROOT/security/turnstile.js"
grep -q "appearance:'interaction-only'" "$OUTPUT_ROOT/security/turnstile.js"
grep -q "execution:'execute'" "$OUTPUT_ROOT/security/turnstile.js"
grep -q 'turnstile_token' "$OUTPUT_ROOT/checkout/checkout-controller.js"
grep -q 'security/turnstile.js' "$OUTPUT_ROOT/index.html"
grep -q 'hk-client-pwa-.*v15\|CACHE_PREFIX.*hk-client-pwa-' "$OUTPUT_ROOT/app-sw.js"
! grep -R -q 'client-kitchen?mode=order' "$OUTPUT_ROOT" --exclude-dir=assets
! grep -R -q 'TURNSTILE_SECRET_KEY' "$OUTPUT_ROOT" --exclude='deploy-meta.json'

test -s "$OUTPUT_ROOT/index.html"
test -s "$OUTPUT_ROOT/app-sw.js"
test -s "$OUTPUT_ROOT/services/client-api.js"
test -s "$OUTPUT_ROOT/security/turnstile.js"
echo 'PUBLIC_CLIENT_RELEASE_CHECK: PASS'

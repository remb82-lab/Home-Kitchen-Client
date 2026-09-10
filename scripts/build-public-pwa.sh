#!/usr/bin/env bash
set -euo pipefail

OUTPUT_ROOT="${OUTPUT_ROOT:-_site}"

required=(
  index.html premium-client.css premium-client-adapter.js app-shell.js app-shell.css app-sw.js manifest.webmanifest client-repeat-order-adapter.js
  data/product-media.js runtime/client-runtime.js services/client-api.js security/turnstile.js contact/client-contact.js
  catalog/catalog-data.js catalog/product-card.js catalog/product-detail.js catalog/catalog-controller.js catalog/product-share.js
  cart/cart-view.js cart/cart-controller.js checkout/checkout-view.js checkout/checkout-controller.js
  orders/orders-view.js orders/orders-controller.js profile/profile-view.js profile/profile-controller.js
  app/app-state.js app/navigation-controller.js app/bootstrap.js assets/branding/home-kitchen-mark.svg
)
for path in "${required[@]}"; do test -s "$path"; done

rm -rf "$OUTPUT_ROOT"
mkdir -p "$OUTPUT_ROOT"
cp index.html premium-client.css premium-client-adapter.js app-shell.js app-shell.css app-sw.js manifest.webmanifest client-repeat-order-adapter.js "$OUTPUT_ROOT/"
for dir in data runtime services security contact catalog cart checkout orders profile app assets; do cp -a "$dir" "$OUTPUT_ROOT/"; done
touch "$OUTPUT_ROOT/.nojekyll"
printf '{"source_sha":"%s","deployed_at":"%s","release":"client-ux-kg-photo50"}\n' "${GITHUB_SHA:-local}" "$(date -u +%FT%TZ)" > "$OUTPUT_ROOT/deploy-meta.json"

# Release contract: modular order gateway + Turnstile + customer-facing UX.
grep -q '/functions/v1/create-client-order' "$OUTPUT_ROOT/services/client-api.js"
grep -q '0x4AAAAAAEvNfqWeNAvsAKeB' "$OUTPUT_ROOT/security/turnstile.js"
grep -q "appearance:'interaction-only'" "$OUTPUT_ROOT/security/turnstile.js"
grep -q "execution:'execute'" "$OUTPUT_ROOT/security/turnstile.js"
grep -q 'turnstile_token' "$OUTPUT_ROOT/checkout/checkout-controller.js"
grep -q 'security/turnstile.js' "$OUTPUT_ROOT/index.html"
grep -q 'v16' "$OUTPUT_ROOT/app-sw.js"

grep -q 'Цена за 1 кг' "$OUTPUT_ROOT/catalog/product-card.js"
! grep -q 'price_half' "$OUTPUT_ROOT/catalog/product-card.js"
! grep -q 'price_half\|add-half' "$OUTPUT_ROOT/catalog/product-detail.js"
grep -q 'Вес заказа' "$OUTPUT_ROOT/catalog/product-detail.js"
grep -q 'data-detail-weight="500"' "$OUTPUT_ROOT/catalog/product-detail.js"
grep -q 'data-detail-weight="1000"' "$OUTPUT_ROOT/catalog/product-detail.js"
! grep -q '>Удалить<' "$OUTPUT_ROOT/cart/cart-view.js"
grep -q 'Перейти в каталог' "$OUTPUT_ROOT/orders/orders-view.js"
grep -q 'Готовим ваш заказ' "$OUTPUT_ROOT/orders/orders-controller.js"
! grep -q 'pbackend\|Supabase Cloud' "$OUTPUT_ROOT/profile/profile-view.js"
! grep -q 'id="pbackend"\|Supabase Cloud\|Подключение к Supabase' "$OUTPUT_ROOT/index.html"

! grep -R -q 'client-kitchen?mode=order' "$OUTPUT_ROOT" --exclude-dir=assets
! grep -R -q 'TURNSTILE_SECRET_KEY' "$OUTPUT_ROOT" --exclude='deploy-meta.json'

test -s "$OUTPUT_ROOT/index.html"
test -s "$OUTPUT_ROOT/app-sw.js"
test -s "$OUTPUT_ROOT/services/client-api.js"
test -s "$OUTPUT_ROOT/security/turnstile.js"
echo 'PUBLIC_CLIENT_RELEASE_CHECK: PASS'

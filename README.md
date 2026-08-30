# Home Kitchen Client

> **Mobile-first PWA storefront for a home food business.**

Home Kitchen Client is the public customer-facing application of the Home Kitchen ecosystem: a responsive catalog, product details, cart, checkout, order history and profile flow designed primarily for mobile use.

[▶ Open Live Demo](https://remb82-lab.github.io/Home-Kitchen-Client/)

## What it demonstrates

- Mobile-first product catalog with search and category filters
- Product detail pages with pricing and preparation information
- Cart and quantity management
- Checkout flow and customer profile
- Order history and order-status UI
- PWA manifest and service-worker support
- Android and iOS install experience
- Optimized product imagery and lazy loading
- GitHub Pages deployment with automated smoke checks

## Product flow

```text
CATALOG → PRODUCT → CART → CHECKOUT → ORDER STATUS
```

## Architecture

This repository contains the public client-facing web application only.

```text
Customer PWA
    ↓
Public client API
    ↓
Home Kitchen backend / publication state
```

The private `remb82-lab/Home-Kitchen` repository remains the source of truth for owner-side business logic, publication state and private operational code.

## Tech

JavaScript · HTML/CSS · PWA · Service Worker · Supabase Edge Function · GitHub Actions · GitHub Pages

## Mobile experience

The client is designed as an installable web app with:

- responsive mobile UI;
- standalone PWA behavior;
- install guidance for Android and iOS;
- persistent app-shell assets;
- touch-friendly catalog, cart and checkout flows.

## Deployment

The public client is deployed through GitHub Actions to GitHub Pages.

Live site:

https://remb82-lab.github.io/Home-Kitchen-Client/

## Repository boundary

This public repository intentionally contains only client-facing assets. Private owner-side source code, production administration logic and internal project infrastructure are kept outside this repository.

## Author

**remb82-lab**

/* Home Kitchen client — app-first PWA bootstrap.
   Browser is a fallback. Installed standalone/TWA mode is the preferred UX.
   The install bar is shown only after real engagement (first add-to-cart or a
   repeat visit), is compact, and remembers dismissal. */
(function () {
  'use strict';

  var DISMISS_KEY = 'hk:pwa-install-dismissed-at';
  var VISITS_KEY = 'hk:visit-count';
  var DISMISS_FOR_MS = 14 * 24 * 60 * 60 * 1000;
  var deferredInstallPrompt = null;
  var engaged = false;

  function readStorage(key) {
    try { return window.localStorage.getItem(key); } catch (error) { return null; }
  }

  function writeStorage(key, value) {
    try { window.localStorage.setItem(key, value); } catch (error) { /* storage may be blocked */ }
  }

  function removeStorage(key) {
    try { window.localStorage.removeItem(key); } catch (error) { /* storage may be blocked */ }
  }

  function isStandalone() {
    return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches ||
      window.navigator.standalone === true ||
      document.referrer.indexOf('android-app://') === 0;
  }

  function isIos() {
    return /iphone|ipad|ipod/i.test(window.navigator.userAgent || '');
  }

  function recentlyDismissed() {
    var raw = readStorage(DISMISS_KEY);
    var dismissedAt = raw ? Number(raw) : 0;
    return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISS_FOR_MS;
  }

  function canOfferInstall() {
    return !isStandalone() && (Boolean(deferredInstallPrompt) || isIos());
  }

  function hideInstallCard() {
    var card = document.getElementById('hk-app-install-card');
    if (card) card.remove();
  }

  function installHelpText() {
    return isIos()
      ? 'На iPhone: нажмите «Поделиться», затем «На экран Домой».'
      : 'Откройте меню браузера и выберите «Установить приложение» или «Добавить на главный экран».';
  }

  function showInstallHelp() {
    var message = installHelpText();
    var shown = false;
    ['hk-app-install-hint', 'hk-install-help'].forEach(function (id) {
      var hint = document.getElementById(id);
      if (!hint) return;
      hint.textContent = message;
      hint.hidden = false;
      shown = true;
    });
    if (!shown && typeof window.toast === 'function') window.toast(message, false);
  }

  async function runInstall() {
    if (!deferredInstallPrompt) {
      showInstallHelp();
      return;
    }
    try {
      deferredInstallPrompt.prompt();
      var choice = await deferredInstallPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') hideInstallCard();
    } finally {
      deferredInstallPrompt = null;
    }
  }

  function buildInstallCard() {
    if (!engaged || !canOfferInstall() || recentlyDismissed() || document.getElementById('hk-app-install-card')) return;

    var card = document.createElement('aside');
    card.id = 'hk-app-install-card';
    card.className = 'hk-app-install-card';
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', 'Установить Домашняя кухня');
    card.innerHTML = '' +
      '<div class="hk-app-install-card__mark" aria-hidden="true">' +
        '<img src="assets/branding/home-kitchen-mark.svg" alt="">' +
      '</div>' +
      '<div class="hk-app-install-card__body">' +
        '<strong>Добавьте на экран телефона</strong>' +
        '<small id="hk-app-install-hint" hidden></small>' +
      '</div>' +
      '<button type="button" class="hk-app-install-card__primary" data-hk-install>Установить</button>' +
      '<button type="button" class="hk-app-install-card__close" data-hk-stay aria-label="Остаться на сайте" title="Остаться на сайте">×</button>';

    card.querySelector('[data-hk-install]').addEventListener('click', runInstall);
    card.querySelector('[data-hk-stay]').addEventListener('click', function () {
      writeStorage(DISMISS_KEY, String(Date.now()));
      hideInstallCard();
    });

    document.body.appendChild(card);
  }

  function markEngaged() {
    if (engaged) return;
    engaged = true;
    // Let the add-to-cart feedback settle before offering anything.
    window.setTimeout(buildInstallCard, 1200);
  }

  function bindProfileInstall() {
    document.addEventListener('click', function (event) {
      var button = event.target.closest && event.target.closest('[data-hk-install-open]');
      if (!button) return;
      runInstall();
    });
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;

    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./app-sw.js?v=20261017-checkout-1', { scope: './', updateViaCache: 'none' })
        .then(function (registration) {
          registration.update().catch(function () {});
        })
        .catch(function (error) {
          console.warn('[Home Kitchen PWA] service worker registration failed', error);
        });
    }, { once: true });
  }

  var reloadingForServiceWorker = false;

  function bindServiceWorkerUpgradeReload() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (reloadingForServiceWorker) return;
      reloadingForServiceWorker = true;
      window.location.reload();
    });
  }

  function markDisplayMode() {
    var standalone = isStandalone();
    document.documentElement.dataset.hkDisplayMode = standalone ? 'app' : 'browser';
    document.body.classList.toggle('hk-app-mode', standalone);
    document.body.classList.toggle('hk-browser-mode', !standalone);
  }

  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    deferredInstallPrompt = event;
    buildInstallCard();
  });

  window.addEventListener('appinstalled', function () {
    deferredInstallPrompt = null;
    removeStorage(DISMISS_KEY);
    hideInstallCard();
    markDisplayMode();
  });

  document.addEventListener('hk:cart-add', markEngaged);

  function boot() {
    markDisplayMode();
    bindServiceWorkerUpgradeReload();
    registerServiceWorker();
    bindProfileInstall();

    // Second and later visits count as engagement.
    var visits = Number(readStorage(VISITS_KEY)) || 0;
    writeStorage(VISITS_KEY, String(visits + 1));
    if (visits >= 1) window.setTimeout(markEngaged, 6000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();

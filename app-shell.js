/* Home Kitchen client — app-first PWA bootstrap.
   Browser is a fallback. Installed standalone/TWA mode is the preferred UX. */
(function () {
  'use strict';

  var DISMISS_KEY = 'hk:pwa-install-dismissed-at';
  var DISMISS_FOR_MS = 24 * 60 * 60 * 1000;
  var deferredInstallPrompt = null;

  function isStandalone() {
    return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia && window.matchMedia('(display-mode: fullscreen)').matches ||
      window.navigator.standalone === true ||
      document.referrer.indexOf('android-app://') === 0;
  }

  function isIos() { return /iphone|ipad|ipod/i.test(window.navigator.userAgent || ''); }
  function recentlyDismissed() {
    var raw = window.localStorage.getItem(DISMISS_KEY);
    var dismissedAt = raw ? Number(raw) : 0;
    return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISS_FOR_MS;
  }
  function hideInstallCard() { var card = document.getElementById('hk-app-install-card'); if (card) card.remove(); }
  function showInstallHelp() {
    var message = isIos() ? 'На iPhone: нажмите «Поделиться», затем «На экран Домой».' : 'Откройте меню браузера и выберите «Установить приложение» или «Добавить на главный экран».';
    var hint = document.getElementById('hk-app-install-hint');
    if (hint) { hint.textContent = message; hint.hidden = false; return; }
    if (typeof window.showNotification === 'function') window.showNotification(message);
  }
  function buildInstallCard() {
    if (isStandalone() || recentlyDismissed() || document.getElementById('hk-app-install-card')) return;
    var card = document.createElement('aside');
    card.id = 'hk-app-install-card';
    card.className = 'hk-app-install-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', 'Установить Home Kitchen');
    card.innerHTML = '<div class="hk-app-install-card__mark" aria-hidden="true"><img src="assets/branding/home-kitchen-mark.svg" alt=""></div><div class="hk-app-install-card__body"><strong>Home Kitchen удобнее как приложение</strong><span>Без адресной строки браузера, с иконкой на телефоне.</span><small id="hk-app-install-hint" hidden></small><div class="hk-app-install-card__actions"><button type="button" class="hk-app-install-card__primary" data-hk-install>Установить приложение</button><button type="button" class="hk-app-install-card__secondary" data-hk-stay>Остаться на сайте</button></div></div>';
    card.querySelector('[data-hk-install]').addEventListener('click', async function () {
      if (!deferredInstallPrompt) { showInstallHelp(); return; }
      try { deferredInstallPrompt.prompt(); var choice = await deferredInstallPrompt.userChoice; if (choice && choice.outcome === 'accepted') hideInstallCard(); }
      finally { deferredInstallPrompt = null; }
    });
    card.querySelector('[data-hk-stay]').addEventListener('click', function () { window.localStorage.setItem(DISMISS_KEY, String(Date.now())); hideInstallCard(); });
    document.body.appendChild(card);
  }
  function registerServiceWorker() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./app-sw.js?v=20260910-client-ux-1', { scope: './', updateViaCache: 'none' })
        .then(function (registration) { registration.update().catch(function () {}); })
        .catch(function (error) { console.warn('[Home Kitchen PWA] service worker registration failed', error); });
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
  window.addEventListener('beforeinstallprompt', function (event) { event.preventDefault(); deferredInstallPrompt = event; buildInstallCard(); });
  window.addEventListener('appinstalled', function () { deferredInstallPrompt = null; window.localStorage.removeItem(DISMISS_KEY); hideInstallCard(); markDisplayMode(); });
  function boot() {
    markDisplayMode();
    bindServiceWorkerUpgradeReload();
    registerServiceWorker();
    if (!isStandalone()) window.setTimeout(buildInstallCard, isIos() ? 900 : 1600);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();

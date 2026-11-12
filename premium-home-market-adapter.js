/* Home-Kitchen Client — Premium Home Market adapter
   Presentation-only adapter. Safe to load after the existing app script. */
(() => {
  const ensureFourItemNav = () => {
    const nav = document.querySelector('.bottom');
    if (!nav) return;
    if (!nav.querySelector('[data-page="cartPage"]')) {
      const cartButton = document.createElement('button');
      cartButton.className = 'nav';
      cartButton.dataset.page = 'cartPage';
      cartButton.innerHTML = '<i>🛒</i>Корзина';
      cartButton.addEventListener('click', () => {
        if (typeof window.openCart === 'function') window.openCart();
        else if (typeof window.go === 'function') window.go('cartPage');
      });
      const orders = nav.querySelector('[data-page="orders"]');
      nav.insertBefore(cartButton, orders || null);
    }
  };

  const decorateProductCards = () => {
    document.querySelectorAll('.product').forEach(card => {
      if (card.dataset.phmReady === '1') return;
      card.dataset.phmReady = '1';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          card.click();
        }
      });
    });
  };

  const polishProfile = () => {
    const backendField = document.getElementById('pbackend');
    if (backendField?.closest('label')) backendField.closest('label').hidden = true;
  };

  const observeCatalog = () => {
    const grid = document.getElementById('grid');
    if (!grid) return;
    decorateProductCards();
    new MutationObserver(decorateProductCards).observe(grid, { childList: true, subtree: true });
  };

  const boot = () => {
    document.documentElement.dataset.phm = 'premium-home-market';
    ensureFourItemNav();
    polishProfile();
    observeCatalog();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();

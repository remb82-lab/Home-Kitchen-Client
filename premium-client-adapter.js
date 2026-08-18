/* Home-Kitchen Client — Premium Home Market adapter.
   Presentation-only enhancement. No API/Supabase/cart/order calculations. */
(function(){
  'use strict';
  var PRODUCT_PLACEHOLDER='assets/images/placeholders/product-photo-placeholder-c-v2.1.svg';
  function usePlaceholder(img){
    if(!img||img.getAttribute('src')===PRODUCT_PLACEHOLDER)return;
    img.dataset.phmPlaceholderActive='true';
    img.removeAttribute('onerror');
    img.setAttribute('src',PRODUCT_PLACEHOLDER);
    if(!img.getAttribute('alt'))img.setAttribute('alt','Фото товара скоро');
  }
  function syncImages(){
    document.querySelectorAll('.product img,#detailContent img,#cartContent img,.detail-photo,.photo').forEach(function(img){
      if(img.dataset.phmPlaceholderBound!=='true'){
        img.dataset.phmPlaceholderBound='true';
        img.addEventListener('error',function(){usePlaceholder(img)});
      }
      var src=(img.getAttribute('src')||'').trim();
      if(!src||src==='#'||src==='about:blank')usePlaceholder(img);
    });
    document.querySelectorAll('.fallback').forEach(function(el){
      el.setAttribute('role','img');
      if(!el.getAttribute('aria-label'))el.setAttribute('aria-label','Фото товара скоро');
    });
  }
  function ensureCartNav(){
    var nav=document.querySelector('.bottom');
    if(!nav||nav.querySelector('[data-page="cartPage"]'))return;
    var cart=document.createElement('button');
    cart.className='nav';cart.dataset.page='cartPage';cart.type='button';
    cart.innerHTML='<i aria-hidden="true">🛒</i>Корзина';
    cart.addEventListener('click',function(){if(typeof window.openCart==='function')window.openCart();else if(typeof window.go==='function')window.go('cartPage');syncNav()});
    var orders=nav.querySelector('[data-page="orders"]');nav.insertBefore(cart,orders||null);
  }
  function syncNav(){
    var active=document.querySelector('.page.active');
    var page=active&&active.id;
    var mapped=(page==='checkoutPage'||page==='successPage')?'cartPage':page;
    document.querySelectorAll('.bottom .nav').forEach(function(btn){btn.classList.toggle('active',btn.dataset.page===mapped);if(btn.dataset.page===mapped)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current')});
  }
  function applyA11y(){
    document.querySelectorAll('button.back').forEach(function(btn){if(!btn.getAttribute('aria-label'))btn.setAttribute('aria-label','Назад')});
    var cart=document.querySelector('.cartbtn');if(cart&&!cart.getAttribute('aria-label'))cart.setAttribute('aria-label','Открыть корзину');
    document.querySelectorAll('.product').forEach(function(card){if(!card.hasAttribute('tabindex'))card.setAttribute('tabindex','0')});
  }
  function boot(){
    document.body.classList.add('phm-client');
    document.documentElement.dataset.clientVisual='premium-home-market-v1';
    ensureCartNav();syncImages();syncNav();applyA11y();
    var root=document.querySelector('.app');
    if(root&&window.MutationObserver){var scheduled=false;new MutationObserver(function(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;ensureCartNav();syncImages();syncNav();applyA11y()})}).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','src']})}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

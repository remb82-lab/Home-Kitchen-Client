/* Home-Kitchen Client — Premium Home Market adapter.
   Presentation-only enhancement. No API/Supabase/cart/order calculations. */
(function(){
  'use strict';
  var PRODUCT_PLACEHOLDER='assets/images/placeholders/product-photo-placeholder-c-v2.1.svg';
  var icons={
    catalog:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    cartPage:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
    orders:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21Z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
    profile:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>'
  };
  var labels={catalog:'Каталог',cartPage:'Корзина',orders:'Заказы',profile:'Профиль'};

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
    cart.addEventListener('click',function(){if(typeof window.openCart==='function')window.openCart();else if(typeof window.go==='function')window.go('cartPage');syncNav()});
    var orders=nav.querySelector('[data-page="orders"]');nav.insertBefore(cart,orders||null);
  }
  function styleNav(){
    document.querySelectorAll('.bottom .nav').forEach(function(btn){
      var page=btn.dataset.page;
      if(!icons[page])return;
      btn.innerHTML='<i class="phm-nav-icon">'+icons[page]+'</i><span>'+labels[page]+'</span>';
    });
  }
  function syncNav(){
    var active=document.querySelector('.page.active');
    var page=active&&active.id;
    var mapped=(page==='checkoutPage'||page==='successPage')?'cartPage':page;
    document.querySelectorAll('.bottom .nav').forEach(function(btn){
      btn.classList.toggle('active',btn.dataset.page===mapped);
      if(btn.dataset.page===mapped)btn.setAttribute('aria-current','page');else btn.removeAttribute('aria-current');
    });
  }
  function polishRootHeaders(){
    ['orders','profile','cartPage'].forEach(function(id){
      var page=document.getElementById(id);if(!page)return;
      var back=page.querySelector(':scope > .top .back, :scope > div > .top .back');
      if(back)back.style.display='none';
      var top=page.querySelector(':scope > .top, :scope > div > .top');
      if(top)top.classList.add('phm-root-top');
    });
  }
  function polishEmptyCart(){
    var root=document.getElementById('cartContent');if(!root)return;
    var empty=root.querySelector('.empty');
    if(!empty||empty.dataset.phmPolished==='true')return;
    if(!/Корзина пуста/i.test(empty.textContent||''))return;
    empty.dataset.phmPolished='true';
    empty.classList.add('phm-empty-cart');
    empty.innerHTML='<div class="phm-empty-icon">'+icons.cartPage+'</div><h2>Корзина пуста</h2><p>Добавьте понравившиеся продукты из каталога</p><button type="button" class="checkout phm-empty-cta">Перейти в каталог</button>';
    var btn=empty.querySelector('button');if(btn)btn.addEventListener('click',function(){if(typeof window.go==='function')window.go('catalog')});
  }
  function polishOrderStatuses(){
    var root=document.getElementById('ordersList');if(!root)return;
    root.querySelectorAll('.badge').forEach(function(b){
      var text=(b.textContent||'').trim().toLowerCase();
      b.classList.toggle('phm-status-cancelled',text==='отменён');
    });
  }
  function applyA11y(){
    document.querySelectorAll('button.back').forEach(function(btn){if(!btn.getAttribute('aria-label'))btn.setAttribute('aria-label','Назад')});
    var cart=document.querySelector('.cartbtn');if(cart&&!cart.getAttribute('aria-label'))cart.setAttribute('aria-label','Открыть корзину');
    document.querySelectorAll('.product').forEach(function(card){if(!card.hasAttribute('tabindex'))card.setAttribute('tabindex','0')});
  }
  function syncAll(){ensureCartNav();styleNav();syncImages();syncNav();polishRootHeaders();polishEmptyCart();polishOrderStatuses();applyA11y()}
  function boot(){
    document.body.classList.add('phm-client');
    document.documentElement.dataset.clientVisual='premium-home-market-v2';
    syncAll();
    var root=document.querySelector('.app');
    if(root&&window.MutationObserver){var scheduled=false;new MutationObserver(function(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;syncAll()})}).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','src']})}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

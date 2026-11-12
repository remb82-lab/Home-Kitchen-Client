/* Home-Kitchen Client — Premium Home Market adapter
   Presentation-only enhancement. No API/Supabase/cart/order calculations. */
(function(){
  'use strict';

  var PRODUCT_PLACEHOLDER='assets/images/placeholders/product-photo-placeholder-c-v2.1.svg';
  var ICON_SPRITE='assets/icons/home-kitchen-ui.svg';
  var PRODUCT_IMAGE_SELECTOR='img[data-product-image], .product img, #detailContent img, #cartContent img, #favoritesContent img, .detail-photo, .thumb, .photo';
  var REPEAT_ORDER_ADAPTER='client-repeat-order-adapter.js';
  var CATALOG_MODULES=[
    {src:'data/product-media.js?v=sto6-phase10-20260901',marker:'data-hk-product-media'},
    {src:'data/product-meta.js?v=sto6-phase10-20260901',marker:'data-hk-product-meta'},
    {src:'runtime/client-runtime.js?v=sto6-phase10-20260901',marker:'data-hk-client-runtime'},
    {src:'services/client-api.js?v=sto6-phase7-20260901',marker:'data-hk-client-api'},
    {src:'contact/client-contact.js?v=sto75-order-phone-20260909',marker:'data-hk-client-contact'},
    {src:'catalog/catalog-data.js?v=sto6-20260901',marker:'data-hk-catalog-data'},
    {src:'catalog/product-card.js?v=client-card-clean-20260903',marker:'data-hk-product-card'},
    {src:'catalog/product-detail.js?v=client-card-clean-20260903',marker:'data-hk-product-detail'},
    {src:'catalog/catalog-controller.js?v=sto6-phase2-20260901',marker:'data-hk-catalog-controller'},
    {src:'catalog/product-share.js?v=sto6-phase10-20260901',marker:'data-hk-product-share'},
    {src:'cart/cart-view.js?v=sto6-phase3-20260901',marker:'data-hk-cart-view'},
    {src:'cart/cart-controller.js?v=sto6-phase3-20260901',marker:'data-hk-cart-controller'},
    {src:'checkout/checkout-view.js?v=sto6-phase4-20260901',marker:'data-hk-checkout-view'},
    {src:'checkout/checkout-controller.js?v=sto6-phase4-20260901',marker:'data-hk-checkout-controller'},
    {src:'orders/orders-view.js?v=sto6-phase5-20260901',marker:'data-hk-orders-view'},
    {src:'orders/orders-controller.js?v=sto6-phase5-20260901',marker:'data-hk-orders-controller'},
    {src:'profile/profile-view.js?v=sto6-phase6-20260901',marker:'data-hk-profile-view'},
    {src:'profile/profile-controller.js?v=sto6-phase6-20260901',marker:'data-hk-profile-controller'},
    {src:'app/app-state.js?v=sto6-phase8-20260901',marker:'data-hk-app-state'},
    {src:'app/navigation-controller.js?v=sto6-phase8-20260901',marker:'data-hk-navigation-controller'},
    {src:'app/bootstrap.js?v=sto6-phase10-20260901',marker:'data-hk-client-bootstrap'}
  ];
  var catalogModulesPromise=null;

  function loadCatalogScript(spec){
    return new Promise(function(resolve,reject){
      if(document.querySelector('script['+spec.marker+']')){resolve();return;}
      var script=document.createElement('script');
      script.src=spec.src;
      script.async=false;
      script.setAttribute(spec.marker,'true');
      script.onload=resolve;
      script.onerror=function(){reject(new Error('Не удалось загрузить '+spec.src));};
      document.head.appendChild(script);
    });
  }

  function ensureCatalogModules(){
    if(window.HKCatalogController)return Promise.resolve(window.HKCatalogController);
    if(catalogModulesPromise)return catalogModulesPromise;
    catalogModulesPromise=CATALOG_MODULES.reduce(function(chain,spec){
      return chain.then(function(){return loadCatalogScript(spec);});
    },Promise.resolve()).then(function(){
      document.documentElement.dataset.hkCatalogArchitecture='modular-v1';
      return window.HKCatalogController;
    }).catch(function(error){
      console.error('[Home Kitchen] modular client failed to load',error);
      document.documentElement.dataset.hkCatalogArchitecture='module-load-failed';
      var state=document.getElementById('backendState');
      if(state)state.innerHTML='<span class="dot bad"></span>Ошибка загрузки приложения';
      return null;
    });
    return catalogModulesPromise;
  }


  function ensureMeta(name,content){
    var selector='meta[name="'+name+'"]';
    var meta=document.head.querySelector(selector);
    if(!meta){
      meta=document.createElement('meta');
      meta.setAttribute('name',name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content',content);
  }

  function ensureRepeatOrderAdapter(){
    if(document.querySelector('script[data-hk-repeat-order]')) return;
    var script=document.createElement('script');
    script.src=REPEAT_ORDER_ADAPTER;
    script.defer=true;
    script.dataset.hkRepeatOrder='true';
    document.head.appendChild(script);
  }

  function ensureAppFirstShell(){
    if(!document.head) return;

    if(!document.head.querySelector('link[rel="manifest"]')){
      var manifest=document.createElement('link');
      manifest.rel='manifest';
      manifest.href='manifest.webmanifest';
      document.head.appendChild(manifest);
    }

    if(!document.head.querySelector('link[data-hk-app-shell]')){
      var shellCss=document.createElement('link');
      shellCss.rel='stylesheet';
      shellCss.href='app-shell.css';
      shellCss.dataset.hkAppShell='true';
      document.head.appendChild(shellCss);
    }

    if(!document.head.querySelector('link[rel="apple-touch-icon"]')){
      var touchIcon=document.createElement('link');
      touchIcon.rel='apple-touch-icon';
      touchIcon.href='assets/branding/home-kitchen-mark.svg';
      document.head.appendChild(touchIcon);
    }

    ensureMeta('theme-color','#0B4B31');
    ensureMeta('mobile-web-app-capable','yes');
    ensureMeta('apple-mobile-web-app-capable','yes');
    ensureMeta('apple-mobile-web-app-title','Home Kitchen');
    ensureMeta('apple-mobile-web-app-status-bar-style','default');

    if(!document.querySelector('script[data-hk-app-shell]')){
      var shellScript=document.createElement('script');
      shellScript.src='app-shell.js';
      shellScript.dataset.hkAppShell='true';
      shellScript.defer=true;
      document.head.appendChild(shellScript);
    }
  }

  function iconMarkup(name){
    return '<svg class="hk-icon" aria-hidden="true" focusable="false"><use href="'+ICON_SPRITE+'#'+name+'"></use></svg>';
  }

  function setIcon(node,name){
    if(!node||node.hidden||node.querySelector('.hk-icon')) return;
    node.innerHTML=iconMarkup(name);
  }

  function iconizeLeading(node,name,token){
    if(!node||node.hidden||node.querySelector('.hk-icon')) return;
    var text=[].find.call(node.childNodes,function(child){return child.nodeType===3&&child.nodeValue.includes(token)});
    if(!text) return;
    text.nodeValue=text.nodeValue.replace(token,'').replace(/^\s+/,'');
    node.insertAdjacentHTML('afterbegin',iconMarkup(name));
    node.classList.add('hk-icon-action');
  }

  function resolveLocalAsset(src){
    try{return new URL(src,document.baseURI).href}catch(_){return src}
  }

  function applyProductPlaceholder(img){
    if(!img||img.dataset.phmPlaceholderBound==='true') return;
    img.dataset.phmPlaceholderBound='true';

    var placeholderUrl=resolveLocalAsset(PRODUCT_PLACEHOLDER);

    function usePlaceholder(){
      var failedSrc=(img.getAttribute('src')||'').trim();
      if(failedSrc===PRODUCT_PLACEHOLDER||failedSrc===placeholderUrl) return;
      img.dataset.phmPlaceholderActive='true';
      img.dataset.phmImageError=failedSrc||'missing-src';
      if(window.console&&typeof window.console.error==='function'){
        window.console.error('[Home Kitchen] product image failed to load',failedSrc||'(empty src)',img.getAttribute('alt')||'');
      }
      img.setAttribute('src',placeholderUrl);
      if(!img.getAttribute('alt')) img.setAttribute('alt','Фото товара скоро');
    }

    img.addEventListener('error',usePlaceholder);
    var src=(img.getAttribute('src')||'').trim();
    if(!src||src==='#'||src==='about:blank'){
      usePlaceholder();
      return;
    }

    if(/^(?:\.\/)?assets\/images\/products\//.test(src)){
      img.dataset.phmProductAsset=src.replace(/^\.\//,'');
      var resolved=resolveLocalAsset(src);
      if(resolved!==src) img.setAttribute('src',resolved);
    }
  }

  function syncProductPlaceholders(){
    document.querySelectorAll(PRODUCT_IMAGE_SELECTOR).forEach(applyProductPlaceholder);
  }

  function applyLabels(){
    document.querySelectorAll('button.back').forEach(function(btn){
      if(!btn.getAttribute('aria-label')) btn.setAttribute('aria-label','Назад');
    });
    document.querySelectorAll('button.heart').forEach(function(btn){
      var isCartClear=(btn.textContent||'').trim().toLowerCase()==='очистить';
      if(isCartClear){
        btn.dataset.cartClear='true';
        btn.setAttribute('aria-label','Очистить корзину');
      }else if(!btn.getAttribute('aria-label')) btn.setAttribute('aria-label','Избранное');
    });
    var cartButton=document.querySelector('button.cart');
    if(cartButton&&!cartButton.getAttribute('aria-label')) cartButton.setAttribute('aria-label','Открыть корзину');
    document.querySelectorAll('button.share').forEach(function(btn){
      if(!btn.getAttribute('aria-label')) btn.setAttribute('aria-label','Поделиться товаром');
    });
    var backendField=document.getElementById('pbackend');
    if(backendField&&backendField.closest('label')) backendField.closest('label').hidden=true;
    document.querySelectorAll('button.primary,button.checkout').forEach(function(btn){
      btn.dataset.primaryAction='true';
    });
    document.querySelectorAll('.product').forEach(function(card){
      if(!card.hasAttribute('tabindex')) card.setAttribute('tabindex','0');
      if(!card.getAttribute('role')) card.setAttribute('role','button');
    });
  }

  function applyIcons(){
    var logo=document.querySelector('#catalog header .logo');
    if(logo&&!logo.querySelector('img')) logo.innerHTML='<img src="assets/branding/home-kitchen-mark.svg" alt="">';
    iconizeLeading(document.querySelector('button.cart'),'cart','🛒');
    var navIcons={catalog:'catalog',cartPage:'cart',orders:'orders',profile:'user'};
    document.querySelectorAll('.bottom .nav').forEach(function(button){
      setIcon(button.querySelector('i'),navIcons[button.dataset.page]);
      if(!button.getAttribute('aria-label')) button.setAttribute('aria-label',(button.textContent||'').trim());
    });
    document.querySelectorAll('button.back').forEach(function(button){setIcon(button,'back')});
    document.querySelectorAll('button.share').forEach(function(button){setIcon(button,'share')});
    document.querySelectorAll('.detail .icons .ic').forEach(function(item,index){setIcon(item.querySelector('i'),['snowflake','box','leaf'][index])});
    document.querySelectorAll('button').forEach(function(button){
      var text=(button.textContent||'').trim();
      if(text.startsWith('🛒')) iconizeLeading(button,'cart','🛒');
      else if(text.startsWith('↻')) iconizeLeading(button,'refresh','↻');
      else if(text.startsWith('🔁')) iconizeLeading(button,'repeat','🔁');
    });
  }

  function ensureCartNav(){
    var nav=document.querySelector('.bottom');
    if(!nav||nav.querySelector('[data-page="cartPage"]')) return;
    var cart=document.createElement('button');
    cart.className='nav';
    cart.dataset.page='cartPage';
    cart.type='button';
    cart.setAttribute('aria-label','Корзина');
    cart.innerHTML='<i aria-hidden="true">'+iconMarkup('cart')+'</i>Корзина';
    cart.addEventListener('click',function(){
      if(typeof window.openCart==='function') window.openCart();
      else if(typeof window.go==='function') window.go('cartPage');
      syncNav();
    });
    var orders=nav.querySelector('[data-page="orders"]');
    nav.insertBefore(cart,orders||null);
  }

  function syncNav(){
    if(window.HKAppState&&typeof window.HKAppState.syncNav==='function'){
      window.HKAppState.syncNav();
      return;
    }
    var active=document.querySelector('.page.active');
    var page=active&&active.id;
    var mapped=(page==='checkoutPage'||page==='successPage')?'cartPage':page;
    document.querySelectorAll('.bottom .nav').forEach(function(btn){
      btn.classList.toggle('active',btn.dataset.page===mapped);
      if(btn.dataset.page===mapped) btn.setAttribute('aria-current','page');
      else btn.removeAttribute('aria-current');
    });
  }

  function addInitialSkeleton(){
    var grid=document.getElementById('grid');
    var state=document.getElementById('backendState');
    if(!grid||grid.children.length) return;
    if(state&&!/Подключение/i.test(state.textContent||'')) return;
    var cards='';
    for(var i=0;i<4;i++){
      cards+='<article class="product" data-phm-skeleton="true" aria-hidden="true">'+
        '<div class="phm-skeleton" style="aspect-ratio:1/1;border-radius:0"></div>'+
        '<div class="pbody"><div class="phm-skeleton" style="height:10px;width:42%;margin-bottom:8px"></div>'+
        '<div class="phm-skeleton" style="height:13px;width:88%;margin-bottom:7px"></div>'+
        '<div class="phm-skeleton" style="height:13px;width:65%;margin-bottom:12px"></div>'+
        '<div class="phm-skeleton" style="height:12px;width:52%"></div></div></article>';
    }
    grid.innerHTML=cards;
  }

  function enableKeyboardCards(){
    document.addEventListener('keydown',function(e){
      if((e.key==='Enter'||e.key===' ')&&e.target&&e.target.classList&&e.target.classList.contains('product')){
        e.preventDefault();
        e.target.click();
      }
    });
  }

  function boot(){
    ensureCatalogModules().then(function(){ensureRepeatOrderAdapter();});
    ensureAppFirstShell();
    document.body.classList.add('phm-client');
    document.documentElement.dataset.clientVisual='premium-home-market-v1';
    var grid=document.getElementById('grid'); if(grid) grid.dataset.designZone='catalog-products';
    var detail=document.getElementById('detailContent'); if(detail) detail.dataset.designZone='product-detail';
    var cart=document.getElementById('cartContent'); if(cart) cart.dataset.designZone='cart';
    ensureCartNav();
    addInitialSkeleton();
    applyLabels();
    applyIcons();
    syncProductPlaceholders();
    syncNav();
    enableKeyboardCards();

    var root=document.querySelector('.app');
    if(root&&window.MutationObserver){
      var scheduled=false;
      new MutationObserver(function(){
        if(scheduled) return;
        scheduled=true;
        requestAnimationFrame(function(){
          scheduled=false;
          applyLabels();
          applyIcons();
          syncProductPlaceholders();
          ensureCartNav();
          syncNav();
        });
      }).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','src']});
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
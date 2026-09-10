/* Home Kitchen client — current order + safe repeat order.
   Reads prior order lines, rebuilds cart from the current catalog, never auto-submits. */
(function(){
  'use strict';

  var ACTIVE_STATUSES=new Set(['new','pending','confirmed','needs_production','preparing','ready']);
  var TERMINAL_STATUSES=new Set(['issued','cancelled']);
  var legacyStatusRu=typeof window.statusRu==='function'?window.statusRu:null;
  var currentRefreshPromise=null;

  function escText(value){
    return String(value==null?'':value).replace(/[&<>"']/g,function(ch){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[ch];
    });
  }

  function statusText(status){
    var known={new:'Ожидает подтверждения',pending:'Ожидает подтверждения',confirmed:'Подтверждён',needs_production:'Готовится',preparing:'Готовится',ready:'Готов',issued:'Выдан',cancelled:'Отменён'};
    if(known[status]) return known[status];
    if(legacyStatusRu) return legacyStatusRu(status);
    return status||'Ожидает';
  }
  function patchLegacyStatusText(){window.statusRu=function(status){return statusText(status);};}
  function fmtMoney(value){if(typeof window.fmt==='function') return window.fmt(value);return Number(value||0).toFixed(2).replace('.',',')+' BYN';}
  async function ensureCatalog(){if(typeof PRODUCTS!=='undefined'&&Array.isArray(PRODUCTS)&&PRODUCTS.length) return true;if(typeof window.loadProducts==='function') await window.loadProducts();return typeof PRODUCTS!=='undefined'&&Array.isArray(PRODUCTS)&&PRODUCTS.length>0;}
  async function fetchOrder(ref){
    if(!ref) return null;
    if(window.HKOrdersController&&typeof window.HKOrdersController.fetchOrder==='function')return window.HKOrdersController.fetchOrder(ref);
    if(ref.order&&Array.isArray(ref.order.items)) return ref.order;
    if(!ref.public_token||!window.HKClientApi||typeof window.HKClientApi.fetchOrder!=='function') return ref.order||null;
    try{var order=await window.HKClientApi.fetchOrder(ref.public_token);ref.order=order;if(typeof orderRefs!=='undefined'&&Array.isArray(orderRefs)&&typeof window.storeJson==='function')window.storeJson('client_api_orders',orderRefs);return order;}catch(_){return ref.order||null;}
  }
  async function latestOrder(){
    if(typeof orderRefs==='undefined'||!Array.isArray(orderRefs)||!orderRefs.length) return null;
    var fallback=null;
    for(var i=0;i<Math.min(orderRefs.length,5);i++){var ref=orderRefs[i];var order=await fetchOrder(ref);if(!order) continue;var entry={ref:ref,order:order,index:i};if(!fallback) fallback=entry;if(ACTIVE_STATUSES.has(String(order.status||''))) return entry;}
    return fallback;
  }
  function currentOrderHost(){
    var catalog=document.getElementById('catalog');if(!catalog) return null;
    var existing=document.getElementById('hk-current-order-card');if(existing) return existing;
    var card=document.createElement('section');card.id='hk-current-order-card';card.className='hk-current-order-card';card.hidden=true;
    var sticky=catalog.querySelector('.sticky');if(sticky) sticky.insertAdjacentElement('afterend',card);else{var header=catalog.querySelector('header');if(header) header.insertAdjacentElement('afterend',card);else catalog.prepend(card);}return card;
  }
  async function renderCurrentOrder(){
    var host=currentOrderHost();if(!host) return;var latest=await latestOrder();if(!latest||!latest.order){host.hidden=true;host.innerHTML='';return;}
    var order=latest.order;var active=ACTIVE_STATUSES.has(String(order.status||''));host.hidden=false;host.dataset.status=String(order.status||'');
    host.innerHTML='<div class="hk-current-order-card__head"><div><span class="hk-current-order-card__eyebrow">'+(active?'ТЕКУЩИЙ ЗАКАЗ':'ПОСЛЕДНИЙ ЗАКАЗ')+'</span><strong>Заказ '+escText(order.id||'')+'</strong></div><span class="hk-current-order-card__status">'+escText(statusText(order.status))+'</span></div><div class="hk-current-order-card__meta">'+(order.total_amount!=null?'<span>Итого: <b>'+escText(fmtMoney(order.total_amount))+'</b></span>':'')+'<span>Позиции: <b>'+String(Array.isArray(order.items)?order.items.length:0)+'</b></span></div><div class="hk-current-order-card__actions"><button type="button" class="secondary" data-hk-open-orders>Открыть заказ</button><button type="button" class="primary" data-hk-repeat-order="'+String(latest.index)+'">Заказать снова</button></div>';
  }
  function addCartLine(productId,grams,qty){if(typeof cart==='undefined'||!Array.isArray(cart)) return;var existing=cart.find(function(row){return String(row.product_id)===String(productId)&&Number(row.grams)===Number(grams);});if(existing) existing.qty=Number(existing.qty||0)+qty;else cart.push({product_id:productId,grams:grams,qty:qty});}
  function addRequestedGrams(productId,totalGrams){var grams=Math.max(0,Math.round(Number(totalGrams)||0));if(!grams) return;var kilos=Math.floor(grams/1000);var remainder=grams%1000;if(kilos) addCartLine(productId,1000,kilos);if(remainder){var halfUnits=Math.ceil(remainder/500);addCartLine(productId,500,halfUnits);}}
  async function repeatOrder(index){
    if(typeof orderRefs==='undefined'||!Array.isArray(orderRefs)||!orderRefs[index]) return;
    var ref=orderRefs[index];var order=await fetchOrder(ref);if(!order||!Array.isArray(order.items)||!order.items.length){if(typeof window.toast==='function') window.toast('Не удалось получить состав заказа',true);return;}
    var ready=await ensureCatalog();if(!ready){if(typeof window.toast==='function') window.toast('Не удалось загрузить актуальный каталог',true);return;}
    var unavailable=[];var changedPrices=[];var added=0;
    order.items.forEach(function(item){var product=(typeof PRODUCTS!=='undefined'&&Array.isArray(PRODUCTS))?PRODUCTS.find(function(p){return String(p.id)===String(item.product_id)}):null;if(!product||String(product.availability||'')==='out_of_stock'){unavailable.push(item.product_name||product?.name||('Товар '+item.product_id));return;}var requested=Math.max(0,Number(item.requested_grams)||0);var oldLine=Number(item.line_total);var currentLine=requested>0?(requested/1000)*Number(product.price_kg||0):0;if(Number.isFinite(oldLine)&&Math.abs(currentLine-oldLine)>0.009)changedPrices.push(item.product_name||product.name||('Товар '+item.product_id));var before=typeof cart!=='undefined'&&Array.isArray(cart)?cart.reduce(function(s,row){return s+Number(row.qty||0)},0):0;addRequestedGrams(product.id,item.requested_grams);var after=typeof cart!=='undefined'&&Array.isArray(cart)?cart.reduce(function(s,row){return s+Number(row.qty||0)},0):before;added+=Math.max(0,after-before);});
    if(typeof window.saveCart==='function') window.saveCart();
    if(!added){if(typeof window.toast==='function')window.toast(unavailable.length?'Все товары из заказа сейчас недоступны':'Не удалось восстановить заказ',true);return;}
    if(typeof window.toast==='function'){var notes=[];if(unavailable.length) notes.push('Недоступные позиции пропущены: '+unavailable.slice(0,3).join(', ')+(unavailable.length>3?'…':''));if(changedPrices.length) notes.push('Цена изменилась: '+changedPrices.slice(0,3).join(', ')+(changedPrices.length>3?'…':''));window.toast(notes.length?notes.join(' · '):'Заказ добавлен в корзину по актуальным ценам',false);}
    if(typeof window.openCart==='function') window.openCart();else if(typeof window.go==='function') window.go('cartPage');
  }
  function decorateOrderCards(){var list=document.getElementById('ordersList');if(!list||typeof orderRefs==='undefined'||!Array.isArray(orderRefs)) return;var cards=Array.from(list.querySelectorAll('.order'));cards.forEach(function(card,index){if(card.querySelector('[data-hk-repeat-order]')||!orderRefs[index]) return;var actions=document.createElement('div');actions.className='hk-order-repeat-actions';actions.innerHTML='<button type="button" class="secondary" data-hk-repeat-order="'+String(index)+'">Заказать снова</button>';card.appendChild(actions);});}
  async function refreshCurrentOrder(){if(window.HKOrdersController&&typeof window.HKOrdersController.refreshCurrentOrder==='function')return window.HKOrdersController.refreshCurrentOrder();if(currentRefreshPromise) return currentRefreshPromise;currentRefreshPromise=renderCurrentOrder().finally(function(){currentRefreshPromise=null});return currentRefreshPromise;}
  function handleClick(event){var repeat=event.target.closest('[data-hk-repeat-order]');if(repeat){event.preventDefault();repeat.disabled=true;repeatOrder(Number(repeat.dataset.hkRepeatOrder)).finally(function(){repeat.disabled=false});return;}if(event.target.closest('[data-hk-open-orders]')){event.preventDefault();if(typeof window.go==='function') window.go('orders');}}
  window.HKRepeatOrder=Object.freeze({repeat:repeatOrder,refreshCurrentOrder:refreshCurrentOrder});
  function boot(){patchLegacyStatusText();document.addEventListener('click',handleClick);var orders=document.getElementById('ordersList');if(orders&&window.MutationObserver){new MutationObserver(function(){decorateOrderCards();refreshCurrentOrder();}).observe(orders,{childList:true,subtree:true});}decorateOrderCards();refreshCurrentOrder();window.addEventListener('focus',refreshCurrentOrder);document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible') refreshCurrentOrder();});}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
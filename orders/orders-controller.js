/* Home Kitchen client orders — controller layer.
   STO 6.5: public-token refresh and history persistence. */
(function(global){
  'use strict';

  if(!global.HKClientApi||!global.HKOrdersView){
    console.warn('[Home Kitchen] modular Orders view unavailable; legacy orders stay active');
    return;
  }

  var STORAGE_KEY='client_api_orders';
  var ACTIVE_STATUSES=new Set(['new','pending','confirmed','needs_production','preparing','ready']);
  var currentRefreshPromise=null;

  function statusText(status){
    var known={
      new:'Ожидает подтверждения',
      pending:'Ожидает подтверждения',
      confirmed:'Подтверждён',
      needs_production:'Готовится',
      preparing:'Готовится',
      ready:'Готов',
      issued:'Выдан',
      cancelled:'Отменён'
    };
    return known[status]||status||'Ожидает';
  }

  function isActive(status){
    return ACTIVE_STATUSES.has(String(status||''));
  }

  function persist(){
    return storeJson(STORAGE_KEY,orderRefs);
  }

  async function fetchOrder(ref){
    if(!ref)return null;
    if(!ref.public_token)return ref.order||null;
    try{
      var order=await global.HKClientApi.fetchOrder(ref.public_token);
      ref.order=order;
      ref.refresh_error='';
      ref.refreshed_at=new Date().toISOString();
      persist();
      return order;
    }catch(error){
      ref.refresh_error=error.message||'Не удалось обновить';
      return ref.order||null;
    }
  }

  async function refreshOrder(ref){
    var before=ref&&ref.order||null;
    var order=await fetchOrder(ref);
    return Boolean(order||before);
  }

  function renderOrdersModular(){
    global.HKOrdersView.renderList(
      ordersList,
      orderRefs,
      {
        escapeHtml:escapeHtml,
        fmt:fmt,
        statusText:statusText,
        profileName:profile&&profile.name||'',
        refresh:refreshOrdersModular
      }
    );
  }

  async function latestOrder(){
    if(!Array.isArray(orderRefs)||!orderRefs.length)return null;
    var fallback=null;
    for(var index=0;index<Math.min(orderRefs.length,5);index++){
      var ref=orderRefs[index];
      var order=await fetchOrder(ref);
      if(!order)continue;
      var entry={ref:ref,order:order,index:index};
      if(!fallback)fallback=entry;
      if(isActive(order.status))return entry;
    }
    return fallback;
  }

  async function renderCurrentOrder(){
    var latest=await latestOrder();
    global.HKOrdersView.renderCurrent(
      latest,
      {
        escapeHtml:escapeHtml,
        fmt:fmt,
        statusText:statusText,
        isActive:isActive
      }
    );
  }

  async function refreshCurrentOrder(){
    if(currentRefreshPromise)return currentRefreshPromise;
    currentRefreshPromise=renderCurrentOrder().finally(function(){
      currentRefreshPromise=null;
    });
    return currentRefreshPromise;
  }

  async function refreshOrdersModular(){
    if(!Array.isArray(orderRefs)||!orderRefs.length){
      renderOrdersModular();
      await refreshCurrentOrder();
      return;
    }
    await Promise.all(orderRefs.map(refreshOrder));
    persist();
    renderOrdersModular();
    await refreshCurrentOrder();
  }

  global.statusRu=statusText;
  global.refreshOrder=refreshOrder;
  global.refreshOrders=refreshOrdersModular;
  global.renderOrders=renderOrdersModular;

  global.HKOrdersController=Object.freeze({
    storageKey:STORAGE_KEY,
    fetchOrder:fetchOrder,
    refreshOrder:refreshOrder,
    refreshOrders:refreshOrdersModular,
    renderOrders:renderOrdersModular,
    refreshCurrentOrder:refreshCurrentOrder,
    latestOrder:latestOrder,
    statusText:statusText,
    isActive:isActive
  });

  document.documentElement.dataset.hkOrdersArchitecture='modular-v1';
  renderOrdersModular();
  refreshCurrentOrder();
})(window);
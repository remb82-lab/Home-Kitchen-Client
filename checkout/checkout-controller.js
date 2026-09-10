/* Home Kitchen client checkout — controller layer.
   STO 6.4: preserves order payload, idempotency and conflict semantics. */
(function(global){
  'use strict';

  if(!global.HKClientApi||!global.HKCheckoutView){
    console.warn('[Home Kitchen] modular Checkout view unavailable; legacy checkout stays active');
    return;
  }

  var PENDING_KEY='client_pending_order';
  var PROFILE_KEY='client_api_profile';
  var ORDERS_KEY='client_api_orders';
  var CART_KEY='client_api_cart';

  function formValuesFromDom(){
    return {
      name:(document.getElementById('coName')?.value||'').trim(),
      phone:(document.getElementById('coPhone')?.value||'').trim(),
      comment:(document.getElementById('coComment')?.value||'').trim()
    };
  }

  function checkoutItems(){
    return cart.map(function(item){
      return {
        product_id:item.product_id,
        grams:item.grams*item.qty
      };
    });
  }

  function openCheckoutModular(){
    var mounted=global.HKCheckoutView.mountForm(
      checkoutContent,
      {
        name:profile.name||'',
        phone:profile.phone||'',
        total:typeof global.total==='function'?global.total():0
      },
      {
        escapeHtml:escapeHtml,
        fmt:fmt,
        contactMarkup:function(variant){
          return global.HKClientContact&&typeof global.HKClientContact.markup==='function'
            ? global.HKClientContact.markup(variant)
            : '';
        },
        back:function(){global.openCart();},
        submit:checkoutModular
      }
    );
    if(mounted){
      go('checkoutPage');
      if(global.HKTurnstile&&typeof global.HKTurnstile.mount==='function'){
        global.HKTurnstile.mount().catch(function(error){
          console.warn('[Home Kitchen] Turnstile preload failed',error&&error.message||error);
        });
      }
    }
  }

  function clearPendingOrder(){
    try{localStorage.removeItem(PENDING_KEY);}catch{}
  }

  function rememberPending(fingerprint){
    var pending=readStoredJson(PENDING_KEY,null);
    if(!pending||pending.fingerprint!==fingerprint){
      pending={key:newUuid(),fingerprint:fingerprint};
    }
    storeJson(PENDING_KEY,pending);
    return pending.key;
  }

  function successReference(response){
    return {
      public_token:response.public_token,
      order:response.order,
      created_at:new Date().toISOString()
    };
  }

  async function checkoutModular(values){
    if(checkoutSubmitting)return;
    var form=values||formValuesFromDom();
    var name=(form.name||'').trim();
    var phone=(form.phone||'').trim();
    var comment=(form.comment||'').trim();

    if(!name){
      alert('Укажите имя');
      return;
    }

    var items=checkoutItems();
    if(!items.length){
      alert('Корзина пуста');
      global.openCart();
      return;
    }

    var payloadFingerprint=JSON.stringify({
      customer_name:name,
      customer_phone:phone,
      comment:comment,
      items:items
    });
    var idempotencyKey=rememberPending(payloadFingerprint);

    checkoutSubmitting=true;
    global.HKCheckoutView.setSubmitting(checkoutContent,true);

    try{
      if(!global.HKTurnstile||typeof global.HKTurnstile.getToken!=='function'){
        throw new Error('Защитная проверка не загрузилась. Обновите страницу и повторите.');
      }
      var turnstileToken=await global.HKTurnstile.getToken();
      if(!turnstileToken){
        throw new Error('Защитная проверка не завершена. Повторите отправку.');
      }

      var response=await global.HKClientApi.createOrder({
        customer:{name:name,phone:phone},
        comment:comment,
        items:items,
        idempotency_key:idempotencyKey,
        turnstile_token:turnstileToken
      });

      profile={name:name,phone:phone};
      storeJson(PROFILE_KEY,profile);

      var ref=successReference(response);
      if(!orderRefs.some(function(item){return item.public_token===ref.public_token;})){
        orderRefs.unshift(ref);
      }

      var historySaved=storeJson(ORDERS_KEY,orderRefs);
      cart=[];
      var cartSaved=storeJson(CART_KEY,cart);
      if(cartSaved)clearPendingOrder();

      if(typeof global.updateCart==='function')global.updateCart();
      showSuccessModular(ref,!historySaved||!cartSaved);
      if(typeof global.loadProducts==='function')global.loadProducts().catch(function(){});
    }catch(error){
      if(error.status===409){
        var productId=error.data&&error.data.product_id;
        var productItem=typeof global.product==='function'?global.product(productId):null;
        global.HKCheckoutView.mountConflict(
          checkoutContent,
          {productName:productItem&&productItem.name||''},
          {
            escapeHtml:escapeHtml,
            back:function(){global.openCart();},
            reload:reloadCartAfterConflictModular
          }
        );
      }else if(error.status===403){
        alert('Защитная проверка не пройдена. Повторите отправку заказа.');
      }else{
        alert('Не удалось создать заказ: '+error.message);
      }
    }finally{
      if(global.HKTurnstile&&typeof global.HKTurnstile.reset==='function') global.HKTurnstile.reset();
      checkoutSubmitting=false;
      global.HKCheckoutView.setSubmitting(checkoutContent,false);
    }
  }

  async function reloadCartAfterConflictModular(button){
    if(button){
      button.disabled=true;
      button.textContent='Обновляем…';
    }
    try{
      if(typeof global.loadProducts==='function')await global.loadProducts();
      global.openCart();
    }catch{
      if(button){
        button.disabled=false;
        button.textContent='Повторить';
      }
    }
  }

  function showSuccessModular(ref,historyWarning){
    var mounted=global.HKCheckoutView.mountSuccess(
      successContent,
      ref,
      Boolean(historyWarning),
      {
        escapeHtml:escapeHtml,
        fmt:fmt,
        statusText:statusRu,
        go:go
      }
    );
    if(mounted)go('successPage');
  }

  global.openCheckout=openCheckoutModular;
  global.checkout=checkoutModular;
  global.reloadCartAfterConflict=reloadCartAfterConflictModular;
  global.showSuccess=showSuccessModular;

  global.HKCheckoutController=Object.freeze({
    pendingKey:PENDING_KEY,
    profileKey:PROFILE_KEY,
    ordersKey:ORDERS_KEY,
    cartKey:CART_KEY,
    open:openCheckoutModular,
    submit:checkoutModular,
    reloadAfterConflict:reloadCartAfterConflictModular,
    showSuccess:showSuccessModular,
    checkoutItems:checkoutItems
  });

  document.documentElement.dataset.hkCheckoutArchitecture='modular-v1';
})(window);
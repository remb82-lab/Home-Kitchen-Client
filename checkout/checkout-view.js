/* Home Kitchen client checkout — presentation layer.
   STO 6.4: form, conflict and success rendering only. */
(function(global){
  'use strict';

  function bind(container,handler){
    container.onclick=function(event){
      var button=event.target.closest('[data-checkout-action]');
      if(button&&container.contains(button))handler(button.dataset.checkoutAction,button);
    };
  }

  function mountForm(container,state,helpers){
    if(!container)return false;
    var contact=typeof helpers.contactMarkup==='function'?helpers.contactMarkup('checkout'):'';
    container.innerHTML=
      '<div class="detail-head">'+
        '<button class="back" type="button" data-checkout-action="back">‹</button>'+
        '<h3>Оформление заказа</h3><span></span>'+
      '</div>'+
      '<div class="form" data-hk-checkout-view="modular-v1">'+
        '<label>Способ получения<input value="Самовывоз" disabled></label>'+
        '<label>Имя<input id="coName" value="'+helpers.escapeHtml(state.name||'')+'"></label>'+
        '<label>Телефон / мессенджер<input id="coPhone" value="'+helpers.escapeHtml(state.phone||'')+'"></label>'+
        '<label>Комментарий<textarea id="coComment" rows="3"></textarea></label>'+
      '</div>'+
      contact+
      '<div class="totalbox">'+
        '<div class="row"><b>Предварительно</b><span class="grand">'+helpers.fmt(state.total)+'</span></div>'+
        '<div class="small">Окончательная сумма и резерв проверяются при создании заказа.</div>'+
      '</div>'+
      '<button id="checkoutSubmit" class="checkout" type="button" data-checkout-action="submit">Подтвердить заказ</button>';

    bind(container,function(action){
      if(action==='back')helpers.back();
      if(action==='submit'){
        helpers.submit({
          name:(container.querySelector('#coName')?.value||'').trim(),
          phone:(container.querySelector('#coPhone')?.value||'').trim(),
          comment:(container.querySelector('#coComment')?.value||'').trim()
        });
      }
    });
    return true;
  }

  function setSubmitting(container,submitting){
    var button=container&&container.querySelector('#checkoutSubmit');
    if(!button)return;
    button.disabled=Boolean(submitting);
    button.textContent=submitting?'Создаём заказ…':'Подтвердить заказ';
  }

  function mountConflict(container,state,helpers){
    if(!container)return false;
    var suffix=state.productName?' «'+helpers.escapeHtml(state.productName)+'»':'';
    container.innerHTML=
      '<div class="detail-head">'+
        '<button class="back" type="button" data-checkout-action="back">‹</button>'+
        '<h3>Заказ не создан</h3><span></span>'+
      '</div>'+
      '<div class="notice error" data-hk-checkout-conflict="stock">Недостаточно доступного товара'+suffix+'. Обновите каталог или измените корзину.</div>'+
      '<button class="checkout" type="button" data-checkout-action="reload">Обновить корзину</button>';
    bind(container,function(action,button){
      if(action==='back')helpers.back();
      if(action==='reload')helpers.reload(button);
    });
    return true;
  }

  function mountSuccess(container,ref,historyWarning,helpers){
    if(!container)return false;
    var order=ref&&ref.order||{};
    var missing=(order.items||[]).reduce(function(sum,item){
      return sum+(Number(item.missing_grams)||0);
    },0);
    var warning=historyWarning
      ? '<div class="notice error">Заказ создан, но браузер не смог сохранить его в историю. Не закрывайте страницу и сохраните код отслеживания: <b>'+helpers.escapeHtml(ref.public_token||'—')+'</b></div>'
      : '';

    container.innerHTML=
      '<div class="thanks" data-hk-checkout-success="modular-v1">'+
        '<div class="ok">✓</div>'+
        '<h2>Заказ принят</h2>'+
        '<p>'+(missing>0?'Часть заказа нужно приготовить. Хозяйка увидит нехватку автоматически.':'Товар зарезервирован.')+'</p>'+
        warning+
        '<div class="totalbox">'+
          '<div class="row"><span>Номер заказа</span><b>№ '+helpers.escapeHtml(order.id||'—')+'</b></div>'+
          '<div class="row" style="margin-top:8px"><span>Статус</span><b>'+helpers.escapeHtml(helpers.statusText(order.status))+'</b></div>'+
          '<div class="row" style="margin-top:8px"><span>Итого</span><b>'+helpers.fmt(order.total_amount)+'</b></div>'+
        '</div>'+
        '<button class="checkout" type="button" data-checkout-action="orders">Следить за заказом</button>'+
        '<button class="secondary" style="width:100%;margin-top:8px" type="button" data-checkout-action="catalog">В каталог</button>'+
      '</div>';

    bind(container,function(action){
      if(action==='orders')helpers.go('orders');
      if(action==='catalog')helpers.go('catalog');
    });
    return true;
  }

  global.HKCheckoutView=Object.freeze({
    mountForm:mountForm,
    setSubmitting:setSubmitting,
    mountConflict:mountConflict,
    mountSuccess:mountSuccess
  });
})(window);

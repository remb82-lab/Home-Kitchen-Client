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
    var count=Number(state.count)||0;
    var countText=count&&typeof helpers.countLabel==='function'?helpers.countLabel(count,['товар','товара','товаров']):'';
    container.innerHTML=
      '<div class="detail-head">'+
        '<button class="back" type="button" data-checkout-action="back">‹</button>'+
        '<h3>Оформление заказа</h3><span></span>'+
      '</div>'+
      '<div class="form" data-hk-checkout-view="modular-v1">'+
        '<div class="form-static"><span>Способ получения</span><b>Самовывоз</b></div>'+
        '<label for="coName">Имя'+
          '<input id="coName" name="name" type="text" autocomplete="name" autocapitalize="words" enterkeyhint="next" required aria-describedby="coNameErr" value="'+helpers.escapeHtml(state.name||'')+'">'+
          '<span class="field-error" id="coNameErr" role="alert" hidden></span></label>'+
        '<label for="coPhone">Телефон или мессенджер'+
          '<input id="coPhone" name="tel" type="tel" inputmode="tel" autocomplete="tel" enterkeyhint="next" placeholder="+375 29 123-45-67" aria-describedby="coPhoneHint coPhoneErr" value="'+helpers.escapeHtml(state.phone||'')+'">'+
          '<span class="field-hint" id="coPhoneHint">Чтобы кухня могла связаться с вами по заказу.</span>'+
          '<span class="field-error" id="coPhoneErr" role="alert" hidden></span></label>'+
        '<label for="coComment">Комментарий'+
          '<textarea id="coComment" name="comment" rows="3" enterkeyhint="done" placeholder="Например, удобное время самовывоза"></textarea></label>'+
      '</div>'+
      contact+
      '<div class="totalbox">'+
        '<div class="row"><b>Итого к оплате</b><span class="grand">'+helpers.fmt(state.total)+'</span></div>'+
        (countText?'<div class="small">В заказе: '+countText+'.</div>':'')+
        '<div class="small">Окончательную сумму и наличие подтверждает кухня после проверки заказа.</div>'+
      '</div>'+
      '<button id="checkoutSubmit" class="checkout" type="button" data-checkout-action="submit">Подтвердить заказ</button>';

    bind(container,function(action){
      if(action==='back')helpers.back();
      if(action==='submit'){
        var values={
          name:(container.querySelector('#coName')?.value||'').trim(),
          phone:(container.querySelector('#coPhone')?.value||'').trim(),
          comment:(container.querySelector('#coComment')?.value||'').trim()
        };
        if(!validate(container,values))return;
        helpers.submit(values);
      }
    });

    ['coName','coPhone'].forEach(function(id){
      var input=container.querySelector('#'+id);
      if(input)input.addEventListener('input',function(){showError(container,id,'');});
    });
    return true;
  }

  function showError(container,id,message){
    var input=container.querySelector('#'+id);
    var error=container.querySelector('#'+id+'Err');
    if(error){
      error.textContent=message||'';
      error.hidden=!message;
    }
    if(input){
      if(message)input.setAttribute('aria-invalid','true');
      else input.removeAttribute('aria-invalid');
    }
  }

  // Presentation-level validation only: the order payload and API rules are unchanged.
  function validate(container,values){
    var firstInvalid=null;
    if(!values.name){
      showError(container,'coName','Укажите имя, чтобы кухня знала, как к вам обращаться.');
      firstInvalid=container.querySelector('#coName');
    }else showError(container,'coName','');

    var phone=values.phone;
    var digits=phone.replace(/\D/g,'');
    var looksLikeHandle=/^@?[A-Za-z0-9_.]{4,}$/.test(phone);
    if(phone&&digits.length<7&&!looksLikeHandle){
      showError(container,'coPhone','Проверьте номер. Пример: +375 29 123-45-67 или @ник в мессенджере.');
      if(!firstInvalid)firstInvalid=container.querySelector('#coPhone');
    }else showError(container,'coPhone','');

    if(firstInvalid){
      firstInvalid.focus();
      if(typeof firstInvalid.scrollIntoView==='function')firstInvalid.scrollIntoView({block:'center',behavior:'smooth'});
      return false;
    }
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
    var displayNumber=String(order.order_number||order.id||'—');
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
        '<p>'+(ref.details_pending?'Заказ сохранён. Подробности можно обновить в разделе «Заказы».':missing>0?'Часть заказа нужно приготовить. Хозяйка увидит нехватку автоматически.':'Товар зарезервирован.')+'</p>'+
        warning+
        '<div class="totalbox">'+
          '<div class="row"><span>Номер заказа</span><b>№ '+helpers.escapeHtml(displayNumber)+'</b></div>'+
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

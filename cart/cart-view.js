/* Home Kitchen client cart — presentation layer.
   STO 6.3: renders cart only; no storage, API or Supabase access. */
(function(global){
  'use strict';

  function plural(count,helpers){
    var forms=['товар','товара','товаров'];
    if(typeof helpers.countLabel==='function')return helpers.countLabel(count,forms);
    return count+' '+forms[2];
  }

  function mount(container,state,helpers){
    if(!container)return false;

    var escapeHtml=helpers.escapeHtml;
    var fmt=helpers.fmt;
    var items=Array.isArray(state.items)?state.items:[];
    var total=Number(state.total)||0;
    var count=Number(state.count)||0;
    var hasItems=items.length>0;

    var rows=hasItems?items.map(function(item){
      return '<div class="cartitem" data-hk-cart-row="modular-v2" data-cart-index="'+item.index+'">'+
        '<img class="thumb" data-product-image src="'+escapeHtml(item.photo||'')+'" alt="'+escapeHtml(item.name||'')+'">'+
        '<div class="cartitem__info">'+
          '<div class="cname">'+escapeHtml(item.name||'')+'</div>'+
          '<div class="small">'+escapeHtml(item.weightLabel)+' · '+fmt(item.unitPrice)+'</div>'+
        '</div>'+
        '<div class="qty">'+
          '<button type="button" data-cart-action="decrease" data-cart-index="'+item.index+'" aria-label="Уменьшить количество">−</button>'+
          '<b>'+item.qty+'</b>'+
          '<button type="button" data-cart-action="increase" data-cart-index="'+item.index+'" aria-label="Увеличить количество">+</button>'+
        '</div>'+
      '</div>';
    }).join(''):
      '<div class="empty cart-empty"><b>Корзина пуста</b><span>Добавьте домашние полуфабрикаты из каталога.</span>'+
      '<button class="checkout" type="button" data-cart-action="back">Перейти в каталог</button></div>';

    container.innerHTML=
      '<div class="detail-head">'+
        '<button class="back" type="button" data-cart-action="back">‹</button>'+
        '<h3>Корзина</h3>'+
        (hasItems?'<button class="heart" type="button" data-cart-action="clear">Очистить</button>':'<span></span>')+
      '</div>'+
      '<div data-hk-cart-view="modular-v2">'+rows+'</div>'+
      (hasItems?
        '<button class="link-action" type="button" data-cart-action="back">‹ Продолжить покупки</button>'+
        '<div class="cart-footer">'+
          '<div class="totalbox">'+
            '<div class="row"><span>Итого ('+plural(count,helpers)+')</span><span class="grand">'+fmt(total)+'</span></div>'+
          '</div>'+
          '<button class="checkout" type="button" data-cart-action="checkout">Оформить заказ</button>'+
        '</div>'
      :'');

    container.onclick=function(event){
      var button=event.target.closest('[data-cart-action]');
      if(!button||!container.contains(button))return;
      var action=button.dataset.cartAction;
      var index=Number(button.dataset.cartIndex);

      if(action==='back')helpers.go('catalog');
      else if(action==='clear')helpers.clear();
      else if(action==='checkout')helpers.checkout();
      else if(action==='decrease')helpers.changeQty(index,-1);
      else if(action==='increase')helpers.changeQty(index,1);
    };

    return true;
  }

  global.HKCartView=Object.freeze({mount:mount});
})(window);

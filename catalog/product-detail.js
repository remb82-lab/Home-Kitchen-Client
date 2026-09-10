/* Home Kitchen client catalog — ProductDetail presentation component.
   Client-facing only: never render production notes or techcard internals here. */
(function(global){
  'use strict';

  function mount(container,product,productMeta,helpers){
    if(!container||!product)return false;

    var escapeHtml=helpers.escapeHtml;
    var fmt=helpers.fmt;
    var photoFor=helpers.photoFor;
    var badgeClass=helpers.badgeClass;
    var meta=productMeta||{};
    var id=Number(product.id);
    var photo=product.image_url||photoFor(id)||'assets/images/placeholders/product-photo-placeholder-c-v2.1.svg';
    var description=product.description||meta.local_description||'';
    var instruction=product.instruction||meta.instruction||'Инструкция уточняется.';
    var status=product.availability==='preorder'
      ? '<span class="badge '+badgeClass(product)+'">Под заказ</span>'
      : product.availability==='out_of_stock'
        ? '<span class="badge '+badgeClass(product)+'">Нет в наличии</span>'
        : '';
    var preorder=product.availability==='preorder'
      ? '<div class="notice hk-client-preorder">Приготовим после оформления заказа.</div>'
      : '';
    var contact=typeof helpers.contactMarkup==='function'?helpers.contactMarkup('detail'):'';

    container.innerHTML=
      '<div class="detail-head">'+
        '<button class="back" type="button" data-detail-action="back">‹</button>'+
        '<h3>'+escapeHtml(product.name)+'</h3>'+
        '<span aria-hidden="true"></span>'+
      '</div>'+
      '<img class="detail-photo" data-product-image src="'+escapeHtml(photo)+'" alt="'+escapeHtml(product.name)+'">'+
      '<div class="detail" data-hk-product-detail="client-clean-v2">'+
        status+
        '<h1>'+escapeHtml(product.name)+'</h1>'+
        (description?'<div class="desc">'+escapeHtml(description)+'</div>':'')+
        '<div class="dprices dprices--kg-only">'+
          '<button class="dprice dprice--primary" type="button" data-detail-action="add-kilo"><span>Цена за 1 кг</span><b>'+fmt(product.price_kg)+' / кг</b><small>Добавить 1 кг</small></button>'+
        '</div>'+
        '<div class="info hk-client-cooking"><b>Как приготовить</b><br>'+escapeHtml(instruction)+'</div>'+
        contact+
        preorder+
        '<div class="actions hk-client-detail-actions">'+
          '<button class="secondary" type="button" data-detail-action="share">Поделиться</button>'+
          '<button class="primary" type="button" data-detail-action="cart"'+(product.availability==='out_of_stock'?' disabled':'')+'>🛒 Добавить 1 кг</button>'+
        '</div>'+
      '</div>';

    container.querySelectorAll('[data-detail-action="back"]').forEach(function(button){
      button.addEventListener('click',function(){helpers.go('catalog');});
    });
    var kilo=container.querySelector('[data-detail-action="add-kilo"]');
    if(kilo)kilo.addEventListener('click',function(){helpers.addCart(id,1000);});
    var cart=container.querySelector('[data-detail-action="cart"]');
    if(cart)cart.addEventListener('click',function(){
      helpers.addCart(id,1000);
      helpers.openCart();
    });
    var share=container.querySelector('[data-detail-action="share"]');
    if(share)share.addEventListener('click',function(){helpers.shareProduct(id);});
    return true;
  }

  global.HKProductDetail=Object.freeze({mount:mount});
})(window);

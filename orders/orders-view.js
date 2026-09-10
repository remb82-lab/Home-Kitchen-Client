/* Home Kitchen client orders — presentation layer.
   STO 6.5: renders order history and current/last order summary only. */
(function(global){
  'use strict';

  function currentHost(){
    var catalog=document.getElementById('catalog');
    if(!catalog)return null;
    var existing=document.getElementById('hk-current-order-card');
    if(existing)return existing;
    var host=document.createElement('section');
    host.id='hk-current-order-card';
    host.className='hk-current-order-card';
    host.hidden=true;
    var sticky=catalog.querySelector('.sticky');
    if(sticky)sticky.insertAdjacentElement('afterend',host);
    else{
      var header=catalog.querySelector('header');
      if(header)header.insertAdjacentElement('afterend',host);
      else catalog.prepend(host);
    }
    return host;
  }

  function renderCurrent(entry,helpers){
    var host=currentHost();
    if(!host)return false;
    if(!entry||!entry.order){
      host.hidden=true;
      host.innerHTML='';
      return true;
    }

    var order=entry.order;
    var active=helpers.isActive(order.status);
    host.hidden=false;
    host.dataset.status=String(order.status||'');
    host.innerHTML=
      '<div class="hk-current-order-card__head">'+
        '<div><span class="hk-current-order-card__eyebrow">'+(active?'ТЕКУЩИЙ ЗАКАЗ':'ПОСЛЕДНИЙ ЗАКАЗ')+'</span>'+
        '<strong>Заказ '+helpers.escapeHtml(order.id||'')+'</strong></div>'+
        '<span class="hk-current-order-card__status">'+helpers.escapeHtml(helpers.statusText(order.status))+'</span>'+
      '</div>'+
      '<div class="hk-current-order-card__meta">'+
        (order.total_amount!=null?'<span>Итого: <b>'+helpers.escapeHtml(helpers.fmt(order.total_amount))+'</b></span>':'')+
        '<span>Позиции: <b>'+String(Array.isArray(order.items)?order.items.length:0)+'</b></span>'+
      '</div>'+
      '<div class="hk-current-order-card__actions">'+
        '<button type="button" class="secondary" data-orders-action="open">Открыть заказ</button>'+
        '<button type="button" class="primary" data-hk-repeat-order="'+String(entry.index)+'">Заказать снова</button>'+
      '</div>';
    return true;
  }

  function renderList(container,entries,helpers){
    if(!container)return false;
    var refs=Array.isArray(entries)?entries:[];
    container.innerHTML=refs.length?refs.map(function(ref,index){
      var order=ref&&ref.order||{};
      var missing=(order.items||[]).reduce(function(sum,item){
        return sum+(Number(item.missing_grams)||0);
      },0);
      var status=String(order.status||'');
      var badgeClass=status==='cancelled'?'bad':status==='needs_production'?'warn':'';
      var error=ref&&ref.refresh_error
        ? '<div class="notice error">Статус может быть устаревшим: '+helpers.escapeHtml(ref.refresh_error)+'</div>'
        : '';

      return '<div class="order" data-hk-order-card="modular-v1">'+
        '<div class="row"><b>№ '+helpers.escapeHtml(order.id||'—')+'</b>'+
          '<span class="badge '+badgeClass+'">'+helpers.escapeHtml(helpers.statusText(status))+'</span></div>'+
        '<div class="small">'+helpers.escapeHtml(order.customer_name||helpers.profileName||'')+'</div>'+
        error+
        '<div class="row" style="margin-top:9px">'+
          '<span>'+String((order.items||[]).length)+' поз.'+
            (missing>0?' · не хватает '+(missing/1000).toFixed(1).replace('.',',')+' кг':'')+
          '</span><b>'+helpers.fmt(order.total_amount)+'</b>'+
        '</div>'+
        '<div class="statusline">'+
          '<button class="refresh" type="button" data-orders-action="refresh">↻ Обновить статус</button>'+
          '<button class="refresh" type="button" data-hk-repeat-order="'+String(index)+'">🔁 Повторить</button>'+
        '</div>'+
      '</div>';
    }).join(''):'<div class="empty">Заказов пока нет</div>';

    container.onclick=function(event){
      var refresh=event.target.closest('[data-orders-action="refresh"]');
      if(refresh&&container.contains(refresh)){
        helpers.refresh();
      }
    };
    return true;
  }

  global.HKOrdersView=Object.freeze({
    renderCurrent:renderCurrent,
    renderList:renderList
  });
})(window);

/* Home-Kitchen Client — 1 kg only ordering mode.
   Keeps the existing API contract; client orders are normalized to whole kilograms. */
(function(){
  'use strict';

  var MODE_MARKER='hk-kg-only-v1';

  function normalizeLegacyCart(){
    if(typeof cart==='undefined'||!Array.isArray(cart))return;

    var changed=false;
    var droppedRemainder=false;
    var grouped=new Map();

    cart.forEach(function(item){
      var qty=Math.max(0,Math.floor(Number(item.qty)||0));
      var grams=Math.max(0,Math.floor(Number(item.grams)||0));
      if(!qty||!grams){changed=true;return;}

      var totalGrams=grams*qty;
      var wholeKg=Math.floor(totalGrams/1000);
      var remainder=totalGrams%1000;
      if(grams!==1000||remainder!==0)changed=true;
      if(remainder!==0)droppedRemainder=true;
      if(wholeKg<=0)return;

      var key=String(item.product_id);
      var existing=grouped.get(key);
      if(existing)existing.qty+=wholeKg;
      else grouped.set(key,{product_id:item.product_id,grams:1000,qty:wholeKg});
    });

    if(changed||grouped.size!==cart.length){
      cart=Array.from(grouped.values());
      if(typeof saveCart==='function')saveCart();
      if(droppedRemainder&&localStorage.getItem(MODE_MARKER)!=='1'&&typeof toast==='function'){
        setTimeout(function(){toast('Корзина пересчитана: теперь заказ только целыми килограммами.');},0);
      }
    }
    localStorage.setItem(MODE_MARKER,'1');
  }

  function installKgOnlyMode(){
    document.documentElement.dataset.clientOrderUnit='1kg';
    if(document.body)document.body.classList.add('hk-kg-only');

    renderCatalog=function(){
      var q=(E.q.value||'').toLowerCase().trim();
      var arr=PRODUCTS.filter(function(p){return(activeCat==='Все'||p.category===activeCat)&&(!q||String(p.name||'').toLowerCase().includes(q));});
      E.catTitle.textContent=activeCat==='Все'?'Каталог':activeCat;
      E.catCount.textContent=arr.length+' поз.';
      E.grid.innerHTML=arr.length?arr.map(function(p){return `<article class="product">${image(p)}<div class="pbody">${typeof clientStatusBadge==='function'?clientStatusBadge(p):''}<div class="ptitle" onclick="openDetail('${p.id}')">${esc(p.name)}</div><div class="prices"><div class="price"><span>1 кг</span><b>${fmt(p.price_kg)}</b></div></div><div class="actions"><button class="secondary" onclick="openDetail('${p.id}')">Подробнее</button><button class="primary" onclick="add('${p.id}',1000)">В корзину</button></div></div></article>`;}).join(''):'<div class="empty" style="grid-column:1/-1">Сейчас нет опубликованных позиций</div>';
    };

    openDetail=function(id){
      var p=getP(id);if(!p)return;
      E.detailContent.innerHTML=`<div class="top"><button class="back" onclick="go('catalog')">‹</button><h3>Карточка продукта</h3><span></span></div>${image(p,true)}<div class="detail">${typeof clientStatusBadge==='function'?clientStatusBadge(p):''}<h1>${esc(p.name)}</h1><div class="desc">${esc(p.description||'Домашний замороженный полуфабрикат.')}</div><div class="dprices" style="grid-template-columns:1fr"><div class="dprice"><span>1 кг</span><b>${fmt(p.price_kg)}</b><button class="checkout" onclick="add('${p.id}',1000)">Добавить 1 кг</button></div></div><div class="info"><b>Как приготовить</b><br>${esc(p.instruction||p.client_instruction||'Готовить по инструкции хозяйки.')}</div><div class="detail-actions"><button class="secondary" onclick="shareProduct('${p.id}')">Поделиться</button><button class="primary" onclick="openCart()">Корзина</button></div></div>`;
      go('detail');
    };

    shareProduct=function(id){
      var p=getP(id);if(!p)return;
      var text=`Домашняя кухня\n${p.name}\n1 кг — ${fmt(p.price_kg)}`;
      if(navigator.share)navigator.share({title:'Домашняя кухня',text:text}).catch(function(){});
      else navigator.clipboard&&navigator.clipboard.writeText(text).then(function(){toast('Скопировано');});
    };

    add=function(id){
      normalizeLegacyCart();
      var p=getP(id);if(!p)return;
      var r=cart.find(function(x){return String(x.product_id)===String(id)&&x.grams===1000;});
      if(r)r.qty++;
      else cart.push({product_id:p.id,grams:1000,qty:1});
      saveCart();
      toast('Добавлен 1 кг');
    };

    total=function(){
      normalizeLegacyCart();
      return cart.reduce(function(sum,x){
        var p=getP(x.product_id);if(!p)return sum;
        return sum+Number(p.price_kg||0)*x.qty;
      },0);
    };

    openCart=function(){
      normalizeLegacyCart();
      var rows=cart.map(function(x,i){
        var p=getP(x.product_id);if(!p)return'';
        return `<div class="cartitem"><div><div class="cname">${esc(p.name)}</div><div class="small">1 кг · ${fmt(p.price_kg)} × ${x.qty}</div></div><div class="qty"><button onclick="qty(${i},-1)">−</button><b>${x.qty}</b><button onclick="qty(${i},1)">+</button></div></div>`;
      }).join('');
      E.cartContent.innerHTML=`<div class="top"><button class="back" onclick="go('catalog')">‹</button><h3>Корзина</h3><span></span></div>${rows||'<div class="empty">Корзина пуста</div>'}${cart.length?`<div class="totalbox"><div class="row"><span>Итого</span><span class="grand">${fmt(total())}</span></div><button class="checkout" onclick="openCheckout()">Оформить заказ</button></div>`:''}`;
      go('cartPage');
    };

    normalizeLegacyCart();
    if(typeof PRODUCTS!=='undefined'&&Array.isArray(PRODUCTS)&&PRODUCTS.length)renderCatalog();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installKgOnlyMode,{once:true});
  else installKgOnlyMode();
})();

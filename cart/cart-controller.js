/* Home Kitchen client cart — controller layer.
   STO 6.3: owns cart mutations while preserving the legacy storage contract. */
(function(global){
  'use strict';

  if(!global.HKCartView){
    console.warn('[Home Kitchen] modular Cart view unavailable; legacy cart stays active');
    return;
  }

  var STORAGE_KEY='client_api_cart';

  function findProduct(id){
    return typeof global.product==='function'?global.product(Number(id)):null;
  }

  function persist(){
    storeJson(STORAGE_KEY,cart);
  }

  function itemCount(){
    return cart.reduce(function(sum,item){
      return sum+(Number(item.qty)||0);
    },0);
  }

  function updateCartModular(){
    cartCount.textContent=String(itemCount());
  }

  function lineTotalModular(item){
    var productItem=findProduct(item.product_id);
    return productItem
      ? (Number(item.grams)/1000)*Number(item.qty)*Number(productItem.price_kg)
      : 0;
  }

  function totalModular(){
    return cart.reduce(function(sum,item){
      return sum+lineTotalModular(item);
    },0);
  }

  function saveCartModular(){
    persist();
    updateCartModular();
  }

  function addCartModular(id,grams){
    var productItem=findProduct(id);
    var normalizedGrams=Number(grams);
    if(!productItem||productItem.availability==='out_of_stock')return;
    if(normalizedGrams!==1000)return;

    var existing=cart.find(function(item){
      return Number(item.product_id)===Number(id)&&Number(item.grams)===normalizedGrams;
    });
    if(existing)existing.qty=Number(existing.qty||0)+1;
    else cart.push({product_id:Number(id),grams:normalizedGrams,qty:1});
    saveCartModular();
  }

  function changeQtyModular(index,delta){
    if(!Number.isInteger(index)||!cart[index])return;
    var next=Number(cart[index].qty||0)+Number(delta||0);
    if(next<=0)cart.splice(index,1);
    else cart[index].qty=next;
    saveCartModular();
    openCartModular();
  }

  function removeCartItem(index){
    if(!Number.isInteger(index)||!cart[index])return;
    cart.splice(index,1);
    saveCartModular();
    openCartModular();
  }

  function clearCartModular(){
    cart=[];
    saveCartModular();
    openCartModular();
  }

  function viewItems(){
    return cart.map(function(item,index){
      var productItem=findProduct(item.product_id);
      if(!productItem)return null;
      var grams=Number(item.grams)||0;
      return {
        index:index,
        productId:Number(item.product_id),
        name:String(productItem.name||''),
        photo:productItem.image_url||PHOTOS[String(productItem.id)]||'',
        grams:grams,
        weightLabel:(grams/1000).toFixed(1).replace('.0','').replace('.',',')+' кг',
        qty:Number(item.qty)||0,
        unitPrice:(grams/1000)*Number(productItem.price_kg||0),
        lineTotal:lineTotalModular(item)
      };
    }).filter(Boolean);
  }

  function openCartModular(){
    var mounted=global.HKCartView.mount(
      cartContent,
      {
        items:viewItems(),
        count:itemCount(),
        total:totalModular()
      },
      {
        escapeHtml:escapeHtml,
        fmt:fmt,
        go:go,
        clear:clearCartModular,
        checkout:function(){if(typeof global.openCheckout==='function')global.openCheckout();},
        changeQty:changeQtyModular,
        remove:removeCartItem
      }
    );
    if(mounted)go('cartPage');
  }

  global.addCart=addCartModular;
  global.updateCart=updateCartModular;
  global.changeQty=changeQtyModular;
  global.removeCartItem=removeCartItem;
  global.lineTotal=lineTotalModular;
  global.total=totalModular;
  global.openCart=openCartModular;
  global.clearCart=clearCartModular;
  global.saveCart=saveCartModular;

  global.HKCartController=Object.freeze({
    storageKey:STORAGE_KEY,
    add:addCartModular,
    changeQty:changeQtyModular,
    remove:removeCartItem,
    clear:clearCartModular,
    save:saveCartModular,
    lineTotal:lineTotalModular,
    total:totalModular,
    count:itemCount,
    open:openCartModular
  });

  document.documentElement.dataset.hkCartArchitecture='modular-v2-kg-only';
  updateCartModular();
})(window);
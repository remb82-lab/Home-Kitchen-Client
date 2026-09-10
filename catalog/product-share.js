/* Home Kitchen product share helper. */
(function(global){
  'use strict';

  function shareProduct(id){
    var product=typeof global.product==='function'?global.product(id):null;
    var details=typeof global.meta==='function'?global.meta(id):{};
    if(!product)return;

    var text=
      product.name+'\n'+
      '0,5 кг — '+global.fmt(product.price_half)+'\n'+
      '1 кг — '+global.fmt(product.price_kg)+'\n'+
      global.availabilityRu(product)+'\n\n'+
      'Как приготовить: '+(details.instruction||'');

    if(navigator.share){
      navigator.share({title:product.name,text:text}).catch(function(){});
    }else if(navigator.clipboard){
      navigator.clipboard.writeText(text).catch(function(){});
    }
  }

  global.shareProduct=shareProduct;
  global.HKProductShare=Object.freeze({share:shareProduct});
})(window);

/* Home Kitchen client API / Supabase service boundary.
   STO 6.7: central transport for modular client runtime.
   Legacy inline transport remains only as rollback fallback until legacy cleanup. */
(function(global){
  'use strict';

  var SUPABASE_URL='https://zdxfxyesdlwzpdknapti.supabase.co';
  var SUPABASE_PUBLISHABLE_KEY='sb_publishable_HYX-B3T2MBHe-QilI_7JQg_2WB3zOTW';
  var REQUEST_TIMEOUT_MS=12000;

  function headers(extra){
    return Object.assign({
      apikey:SUPABASE_PUBLISHABLE_KEY,
      Authorization:'Bearer '+SUPABASE_PUBLISHABLE_KEY,
      'Content-Type':'application/json'
    },extra||{});
  }

  async function cloudFetch(url,options){
    var opts=options||{};
    var controller=new AbortController();
    var timer=setTimeout(function(){controller.abort();},REQUEST_TIMEOUT_MS);

    try{
      var response=await fetch(url,Object.assign({},opts,{
        signal:controller.signal,
        headers:headers(opts.headers||{})
      }));
      var raw=await response.text();
      var data=null;
      try{data=raw?JSON.parse(raw):null;}catch{data=raw;}

      if(!response.ok){
        var error=new Error(
          data&&data.message ||
          data&&data.hint ||
          data&&data.error ||
          ('HTTP '+response.status)
        );
        error.status=response.status;
        error.data=data;
        throw error;
      }
      return data;
    }catch(error){
      if(error&&error.name==='AbortError'){
        var timeoutError=new Error('Сервер не ответил за 12 секунд');
        timeoutError.status=408;
        throw timeoutError;
      }
      throw error;
    }finally{
      clearTimeout(timer);
    }
  }

  function normalizeError(error){
    var message=error&&error.message||'Supabase error';
    var normalized=new Error(message);
    normalized.status=
      message.includes('insufficient_stock')||message.includes('product_unavailable')
        ? 409
        : error&&error.status||400;
    normalized.data=error&&error.data||{error:message};
    return normalized;
  }

  async function request(path,options){
    var opts=options||{};
    try{
      if(path==='/api/client/products'){
        var catalog=await cloudFetch(
          SUPABASE_URL+'/rest/v1/rpc/get_client_catalog',
          {method:'POST',body:'{}'}
        );
        return {
          items:(catalog||[]).map(function(product){
            return Object.assign({},product,{
              stock:{free_grams:Number(product.free_grams)||0},
              price_half:Number(product.price_half)||0,
              price_kg:Number(product.price_kg)||0
            });
          })
        };
      }

      if(path==='/api/client/contact'){
        var contact=await cloudFetch(
          SUPABASE_URL+'/rest/v1/rpc/get_client_contact',
          {method:'POST',body:'{}'}
        );
        return {
          kitchen_name:String(contact&&contact.kitchen_name||'Домашняя кухня'),
          phone:String(contact&&contact.phone||''),
          messenger:String(contact&&contact.messenger||'')
        };
      }

      if(path==='/api/client/orders'&&String(opts.method||'GET').toUpperCase()==='POST'){
        var body=JSON.parse(opts.body||'{}');
        var created=await cloudFetch(
          SUPABASE_URL+'/functions/v1/create-client-order',
          {
            method:'POST',
            body:JSON.stringify({
              customer_name:body.customer&&body.customer.name||'',
              customer_phone:body.customer&&body.customer.phone||'',
              comment:body.comment||'',
              items:body.items||[],
              idempotency_key:body.idempotency_key,
              turnstile_token:body.turnstile_token||''
            })
          }
        );
        var token=created&&created.public_token;
        if(!token)throw new Error('Сервер не вернул номер отслеживания заказа');

        var createdOrder=await cloudFetch(
          SUPABASE_URL+'/rest/v1/rpc/get_client_order',
          {method:'POST',body:JSON.stringify({p_token:token})}
        );
        return {public_token:token,order:createdOrder};
      }

      if(path.indexOf('/api/client/orders/')===0){
        var orderToken=decodeURIComponent(path.split('/').pop());
        var order=await cloudFetch(
          SUPABASE_URL+'/rest/v1/rpc/get_client_order',
          {method:'POST',body:JSON.stringify({p_token:orderToken})}
        );
        if(!order){
          var notFound=new Error('Заказ не найден');
          notFound.status=404;
          throw notFound;
        }
        return order;
      }

      throw new Error('Неизвестный Supabase route: '+path);
    }catch(error){
      throw normalizeError(error);
    }
  }

  function fetchCatalog(){
    return request('/api/client/products');
  }

  function fetchContact(){
    return request('/api/client/contact');
  }

  function createOrder(payload){
    return request('/api/client/orders',{
      method:'POST',
      body:JSON.stringify(payload||{})
    });
  }

  function fetchOrder(publicToken){
    return request('/api/client/orders/'+encodeURIComponent(publicToken||''));
  }

  global.HKClientApi=Object.freeze({
    request:request,
    fetchCatalog:fetchCatalog,
    fetchContact:fetchContact,
    createOrder:createOrder,
    fetchOrder:fetchOrder,
    timeoutMs:REQUEST_TIMEOUT_MS
  });

  document.documentElement.dataset.hkClientApiArchitecture='service-v1';
})(window);

/* Home Kitchen client runtime core.
   STO 6.10: state, storage, DOM references and shared helpers only. */
(function(global){
  'use strict';

  function readStoredJson(key,fallback){
    try{
      var raw=localStorage.getItem(key);
      return raw===null?fallback:JSON.parse(raw);
    }catch(error){
      console.warn('Повреждённые локальные данные',key,error);
      return fallback;
    }
  }

  function storeJson(key,value){
    try{
      localStorage.setItem(key,JSON.stringify(value));
      return true;
    }catch(error){
      console.warn('Не удалось сохранить локальные данные',key,error);
      return false;
    }
  }

  function fmt(value){
    return Number(value||0).toFixed(2).replace('.',',')+' BYN';
  }

  function escapeHtml(value){
    return String(value==null?'':value).replace(/[&<>"']/g,function(ch){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch];
    });
  }

  function safeId(value){
    var number=Number(value);
    return Number.isSafeInteger(number)&&number>0?number:0;
  }

  function newUuid(){
    if(crypto.randomUUID)return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(char){
      var random=crypto.getRandomValues(new Uint8Array(1))[0]&15;
      return (char==='x'?random:(random&3|8)).toString(16);
    });
  }

  function meta(id){
    return (global.META&&global.META[String(id)])||{
      yield_plan:'',
      instruction:'',
      local_description:''
    };
  }

  global.readStoredJson=readStoredJson;
  global.storeJson=storeJson;
  global.fmt=fmt;
  global.escapeHtml=escapeHtml;
  global.safeId=safeId;
  global.newUuid=newUuid;
  global.meta=meta;

  global.PRODUCTS=[];
  global.activeCat='Все';
  global.checkoutSubmitting=false;
  global.clientContact={
    kitchen_name:'Домашняя кухня',
    phone:'',
    messenger:''
  };

  var cart=readStoredJson('client_api_cart',[]);
  var orderRefs=readStoredJson('client_api_orders',[]);
  var profile=readStoredJson('client_api_profile',{name:'',phone:''});

  global.cart=Array.isArray(cart)?cart:[];
  global.orderRefs=Array.isArray(orderRefs)?orderRefs:[];
  global.profile=profile&&typeof profile==='object'&&!Array.isArray(profile)?profile:{name:'',phone:''};

  [
    'backendState','q','filters','catTitle','catCount','grid','detailContent',
    'cartCount','ordersList','pname','pphone','pbackend','cartContent',
    'checkoutContent','successContent'
  ].forEach(function(id){
    global[id]=document.getElementById(id);
  });

  global.HKClientRuntime=Object.freeze({
    readStoredJson:readStoredJson,
    storeJson:storeJson,
    fmt:fmt,
    escapeHtml:escapeHtml,
    safeId:safeId,
    newUuid:newUuid,
    meta:meta
  });

  document.documentElement.dataset.hkClientRuntime='core-v1';
})(window);

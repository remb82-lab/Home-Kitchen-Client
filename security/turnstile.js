/* Home Kitchen client Turnstile guard.
   Frontend-only token acquisition; server-side validation remains mandatory. */
(function(global){
  'use strict';

  var SITE_KEY='0x4AAAAAAEvNfqWeNAvsAKeB';
  var SCRIPT_ID='hk-turnstile-api';
  var HOST_ID='turnstileHost';
  var scriptPromise=null;
  var widgetId=null;
  var token='';
  var pendingResolve=null;
  var pendingReject=null;
  var pendingTimer=null;

  function clearPending(){
    if(pendingTimer){clearTimeout(pendingTimer);pendingTimer=null;}
    pendingResolve=null;
    pendingReject=null;
  }

  function failPending(message){
    if(pendingReject) pendingReject(new Error(message||'Не удалось пройти защитную проверку'));
    clearPending();
  }

  function loadApi(){
    if(global.turnstile) return Promise.resolve(global.turnstile);
    if(scriptPromise) return scriptPromise;
    scriptPromise=new Promise(function(resolve,reject){
      var existing=document.getElementById(SCRIPT_ID);
      if(existing){
        existing.addEventListener('load',function(){global.turnstile?resolve(global.turnstile):reject(new Error('Turnstile API unavailable'));},{once:true});
        existing.addEventListener('error',function(){reject(new Error('Не удалось загрузить защитную проверку'));},{once:true});
        return;
      }
      var script=document.createElement('script');
      script.id=SCRIPT_ID;
      script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async=true;
      script.defer=true;
      script.onload=function(){global.turnstile?resolve(global.turnstile):reject(new Error('Turnstile API unavailable'));};
      script.onerror=function(){reject(new Error('Не удалось загрузить защитную проверку'));};
      document.head.appendChild(script);
    });
    return scriptPromise;
  }

  function ensureHost(){
    var host=document.getElementById(HOST_ID);
    if(host) return host;
    var submit=document.getElementById('checkoutSubmit');
    if(!submit||!submit.parentNode) return null;
    host=document.createElement('div');
    host.id=HOST_ID;
    host.className='hk-turnstile-host';
    host.setAttribute('aria-live','polite');
    host.style.minHeight='1px';
    host.style.marginTop='8px';
    submit.parentNode.insertBefore(host,submit);
    return host;
  }

  async function mount(){
    var host=ensureHost();
    if(!host) throw new Error('Форма проверки недоступна');
    var api=await loadApi();
    if(widgetId!==null) return widgetId;
    widgetId=api.render('#'+HOST_ID,{
      sitekey:SITE_KEY,
      theme:'auto',
      size:'flexible',
      appearance:'interaction-only',
      execution:'execute',
      callback:function(value){
        token=String(value||'');
        if(pendingResolve){pendingResolve(token);clearPending();}
      },
      'expired-callback':function(){token='';},
      'timeout-callback':function(){token='';failPending('Защитная проверка истекла. Повторите отправку.');},
      'error-callback':function(){token='';failPending('Не удалось пройти защитную проверку');}
    });
    return widgetId;
  }

  async function getToken(){
    var api=await loadApi();
    await mount();
    if(token) return token;
    return new Promise(function(resolve,reject){
      pendingResolve=resolve;
      pendingReject=reject;
      pendingTimer=setTimeout(function(){failPending('Защитная проверка заняла слишком много времени');},15000);
      try{api.execute(widgetId);}catch(error){failPending(error&&error.message||'Не удалось запустить защитную проверку');}
    });
  }

  function reset(){
    token='';
    clearPending();
    if(global.turnstile&&widgetId!==null){
      try{global.turnstile.reset(widgetId);}catch(_){}
    }
  }

  global.HKTurnstile=Object.freeze({
    siteKey:SITE_KEY,
    mount:mount,
    getToken:getToken,
    reset:reset
  });
})(window);

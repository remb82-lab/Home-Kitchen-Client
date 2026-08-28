/* Home Kitchen public PWA install helper */
(function(){
  'use strict';
  var DISMISS_KEY='hk:pwa-install-dismissed-at';
  var deferredPrompt=null;

  function standalone(){
    return (window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches) ||
      window.navigator.standalone===true ||
      document.referrer.indexOf('android-app://')===0;
  }
  function ios(){return /iphone|ipad|ipod/i.test(navigator.userAgent||'');}
  function dismissed(){
    var t=Number(localStorage.getItem(DISMISS_KEY)||0);
    return t && Date.now()-t<24*60*60*1000;
  }
  function remove(){var el=document.getElementById('hk-install-card');if(el)el.remove();}
  function show(){
    if(standalone()||dismissed()||document.getElementById('hk-install-card'))return;
    var isIos=ios();
    var el=document.createElement('aside');
    el.id='hk-install-card';
    el.className='hk-install-card';
    el.setAttribute('role','dialog');
    el.setAttribute('aria-label','Установить Home Kitchen');
    el.innerHTML=
      '<div class="hk-install-card__icon"><img src="./icon.svg" alt=""></div>'+
      '<div class="hk-install-card__body">'+
      '<strong>'+(isIos?'Установить Home Kitchen на iPhone':'Установить Home Kitchen')+'</strong>'+
      '<span>'+(isIos?'Откроется как отдельное приложение без адресной строки Safari.':'Откроется как отдельное приложение без адресной строки браузера.')+'</span>'+
      '<small id="hk-install-help"'+(isIos?'':' hidden')+'>'+(isIos?'Нажмите «Поделиться» в Safari → «На экран Домой» → «Добавить».':'')+'</small>'+
      '<div class="hk-install-card__actions">'+
      '<button type="button" class="hk-install-primary" data-install>'+(isIos?'Как установить':'Установить приложение')+'</button>'+
      '<button type="button" class="hk-install-secondary" data-stay>Остаться на сайте</button>'+
      '</div></div>';
    el.querySelector('[data-install]').addEventListener('click',async function(){
      if(deferredPrompt){
        deferredPrompt.prompt();
        try{var c=await deferredPrompt.userChoice;if(c&&c.outcome==='accepted')remove();}catch(_){}
        deferredPrompt=null;
      }else{
        var help=document.getElementById('hk-install-help');
        if(help){help.hidden=false;help.textContent=isIos?'Нажмите кнопку «Поделиться» в Safari, затем «На экран Домой» и «Добавить».':'Откройте меню браузера и выберите «Установить приложение».';}
      }
    });
    el.querySelector('[data-stay]').addEventListener('click',function(){
      localStorage.setItem(DISMISS_KEY,String(Date.now()));remove();
    });
    document.body.appendChild(el);
  }

  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferredPrompt=e;show();});
  window.addEventListener('appinstalled',function(){localStorage.removeItem(DISMISS_KEY);remove();});
  function boot(){
    if('serviceWorker' in navigator&&window.isSecureContext){
      navigator.serviceWorker.register('./app-sw.js',{scope:'./'}).catch(function(e){console.warn('[HK PWA] SW failed',e);});
    }
    if(!standalone())setTimeout(show,ios()?600:1400);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
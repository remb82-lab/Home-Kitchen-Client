/* Home Kitchen — Telegram Mini App shell.
 * Inside Telegram the client bar (fullscreen close/menu buttons) overlays the page.
 * Telegram reports its height only via WebApp.safeAreaInset / contentSafeAreaInset,
 * so we mirror it into --hk-top-inset, which premium-client.css uses for the header.
 * Outside Telegram (no initData) this file does nothing. */
(function(){
  'use strict';
  var root=document.documentElement;

  function webApp(){
    var tg=window.Telegram&&window.Telegram.WebApp;
    return tg&&typeof tg.initData==='string'&&tg.initData.length?tg:null;
  }

  function call(tg,name){
    if(typeof tg[name]!=='function')return;
    try{tg[name].apply(tg,Array.prototype.slice.call(arguments,2))}catch(_){}
  }

  function applyInsets(tg){
    var safe=(tg.safeAreaInset&&Number(tg.safeAreaInset.top))||0;
    var content=(tg.contentSafeAreaInset&&Number(tg.contentSafeAreaInset.top))||0;
    root.style.setProperty('--hk-top-inset',Math.max(0,safe+content)+'px');
  }

  function init(){
    var tg=webApp();
    if(!tg)return false;
    root.classList.add('in-telegram');
    call(tg,'ready');
    call(tg,'expand');
    call(tg,'setHeaderColor','#f7f3e9');
    call(tg,'setBackgroundColor','#f7f3e9');
    applyInsets(tg);
    if(typeof tg.onEvent==='function'){
      ['safeAreaChanged','contentSafeAreaChanged','fullscreenChanged','viewportChanged'].forEach(function(evt){
        try{tg.onEvent(evt,function(){applyInsets(tg)})}catch(_){}
      });
    }
    return true;
  }

  window.HKTelegramShell=Object.freeze({init:init,isTelegram:function(){return !!webApp()}});
  init();
})();

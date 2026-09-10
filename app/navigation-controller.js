/* Home Kitchen client navigation controller.
   STO 6.8: replaces legacy go() while preserving page hooks. */
(function(global){
  'use strict';

  if(!global.HKAppState){
    console.warn('[Home Kitchen] modular app state unavailable; legacy navigation stays active');
    return;
  }

  var legacyGo=typeof global.go==='function'?global.go:null;

  function runPageHook(pageId){
    if(pageId==='orders'&&typeof global.refreshOrders==='function'){
      global.refreshOrders();
    }
    if(pageId==='profile'&&typeof global.loadProfile==='function'){
      global.loadProfile();
    }
  }

  function scrollTop(){
    if(typeof global.scrollTo==='function'){
      global.scrollTo({top:0,behavior:'smooth'});
    }
  }

  function goModular(pageId){
    if(!global.HKAppState.activate(pageId)){
      if(legacyGo&&legacyGo!==goModular)return legacyGo(pageId);
      return false;
    }
    runPageHook(pageId);
    scrollTop();
    return true;
  }

  global.go=goModular;

  global.HKNavigationController=Object.freeze({
    go:goModular,
    currentPage:global.HKAppState.currentPage,
    syncNav:global.HKAppState.syncNav
  });

  document.documentElement.dataset.hkNavigationArchitecture='modular-v1';
  global.HKAppState.syncNav();
})(window);

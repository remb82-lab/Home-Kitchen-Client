/* Home Kitchen client app state.
   STO 6.8: current page + bottom-navigation state only. */
(function(global){
  'use strict';

  var PAGES=Object.freeze([
    'catalog',
    'detail',
    'orders',
    'profile',
    'cartPage',
    'checkoutPage',
    'successPage'
  ]);

  function pageExists(pageId){
    return PAGES.includes(pageId)&&Boolean(document.getElementById(pageId));
  }

  function currentPage(){
    var active=document.querySelector('.page.active');
    return active&&active.id||'catalog';
  }

  function navPageFor(pageId){
    return pageId==='checkoutPage'||pageId==='successPage'?'cartPage':pageId;
  }

  function syncNav(pageId){
    var current=pageId||currentPage();
    var mapped=navPageFor(current);
    document.querySelectorAll('.bottom .nav').forEach(function(button){
      var active=button.dataset.page===mapped;
      button.classList.toggle('active',active);
      if(active)button.setAttribute('aria-current','page');
      else button.removeAttribute('aria-current');
    });
    return mapped;
  }

  function activate(pageId){
    if(!pageExists(pageId))return false;
    document.querySelectorAll('.page').forEach(function(page){
      page.classList.toggle('active',page.id===pageId);
    });
    syncNav(pageId);
    document.documentElement.dataset.hkCurrentPage=pageId;
    return true;
  }

  global.HKAppState=Object.freeze({
    pages:PAGES,
    currentPage:currentPage,
    navPageFor:navPageFor,
    syncNav:syncNav,
    activate:activate
  });

  document.documentElement.dataset.hkAppStateArchitecture='modular-v1';
})(window);

/* Home Kitchen modular client bootstrap.
   STO 6.10: starts the modular runtime after all feature modules are loaded. */
(function(global){
  'use strict';

  var started=false;

  async function boot(){
    if(started)return;
    started=true;

    if(typeof global.renderFilters==='function')global.renderFilters();
    if(typeof global.renderCatalog==='function')global.renderCatalog();
    if(typeof global.renderOrders==='function')global.renderOrders();
    if(typeof global.loadProfile==='function')global.loadProfile();
    if(typeof global.updateCart==='function')global.updateCart();

    if(typeof global.loadProducts!=='function'){
      throw new Error('Модуль каталога не загружен');
    }
    await global.loadProducts();

    document.documentElement.dataset.hkClientBootstrap='ready';
  }

  global.HKClientBootstrap=Object.freeze({boot:boot});

  boot().catch(function(error){
    console.error('Client modular bootstrap',error);
    if(global.backendState){
      global.backendState.innerHTML='<span class="dot bad"></span>Ошибка запуска';
    }
    if(global.grid){
      global.grid.innerHTML='<div class="notice error" style="grid-column:1/-1">Ошибка запуска: '+
        global.escapeHtml(error.message)+'</div>';
    }
    document.documentElement.dataset.hkClientBootstrap='error';
  });
})(window);

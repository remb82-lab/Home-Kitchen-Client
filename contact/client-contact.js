/* Home Kitchen client — public order contact.
   Reads only the public phone exposed by get_client_contact(); private owner data stays behind RLS. */
(function(global){
  'use strict';

  function normalize(value){
    var source=value&&typeof value==='object'?value:{};
    return {
      kitchen_name:String(source.kitchen_name||'Домашняя кухня').trim()||'Домашняя кухня',
      phone:String(source.phone||'').trim(),
      messenger:String(source.messenger||'').trim()
    };
  }

  function telHref(phone){
    var raw=String(phone||'').trim();
    if(!raw)return '';
    var normalized=raw.replace(/[^\d+]/g,'');
    if(normalized.indexOf('00')===0)normalized='+'+normalized.slice(2);
    return normalized?'tel:'+normalized:'';
  }

  function current(){
    return normalize(global.clientContact);
  }

  function markup(variant){
    var contact=current();
    var href=telHref(contact.phone);
    if(!contact.phone||!href)return '';
    var escape=typeof global.escapeHtml==='function'?global.escapeHtml:function(value){return String(value||'');};
    return '<div class="client-order-phone client-order-phone--inline" data-hk-client-contact="'+escape(variant||'inline')+'">'+
      '<div class="client-order-phone__copy">'+
        '<span class="client-order-phone__label">Заказ по телефону</span>'+
        '<a class="client-order-phone__number" href="'+escape(href)+'">'+escape(contact.phone)+'</a>'+
      '</div>'+
      '<a class="client-order-phone__call" href="'+escape(href)+'" aria-label="Позвонить для заказа">Позвонить</a>'+
    '</div>';
  }

  function renderCatalog(){
    var host=document.getElementById('clientOrderPhone');
    if(!host)return;
    host.innerHTML=markup('catalog');
  }

  function set(value){
    global.clientContact=normalize(value);
    renderCatalog();
    return global.clientContact;
  }

  async function load(){
    if(!global.HKClientApi||typeof global.HKClientApi.fetchContact!=='function'){
      renderCatalog();
      return current();
    }
    try{
      return set(await global.HKClientApi.fetchContact());
    }catch(error){
      console.warn('[Home Kitchen] public order phone is unavailable',error);
      renderCatalog();
      return current();
    }
  }

  global.HKClientContact=Object.freeze({
    load:load,
    set:set,
    get:current,
    markup:markup,
    telHref:telHref,
    renderCatalog:renderCatalog
  });

  renderCatalog();
})(window);

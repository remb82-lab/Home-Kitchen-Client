/* Home Kitchen client — public order contact.
   Reads only the public phone exposed by get_client_contact(); private owner data stays behind RLS. */
(function(global){
  'use strict';

  var PHONE_ICON='<svg class="hk-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>';

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
    var kind=variant||'inline';

    // Catalog: one compact icon button in the header. The number stays reachable via tel: and the label.
    if(kind==='catalog'){
      return '<a class="client-order-phone__call client-order-phone__call--icon" data-hk-client-contact="catalog" href="'+escape(href)+'"'+
        ' aria-label="Позвонить для заказа: '+escape(contact.phone)+'" title="Заказ по телефону: '+escape(contact.phone)+'">'+
        PHONE_ICON+'</a>';
    }

    // Detail, checkout, profile: one slim line.
    return '<div class="client-order-phone client-order-phone--inline" data-hk-client-contact="'+escape(kind)+'">'+
      '<span class="client-order-phone__label">Заказ по телефону</span>'+
      '<a class="client-order-phone__number" href="'+escape(href)+'">'+escape(contact.phone)+'</a>'+
      '<a class="client-order-phone__call" href="'+escape(href)+'" aria-label="Позвонить для заказа">'+PHONE_ICON+'Позвонить</a>'+
    '</div>';
  }

  function renderCatalog(){
    var host=document.getElementById('clientOrderPhone');
    if(host)host.innerHTML=markup('catalog');
    var profileHost=document.getElementById('profileContact');
    if(profileHost)profileHost.innerHTML=markup('profile');
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

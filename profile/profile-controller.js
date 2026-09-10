/* Home Kitchen client profile — controller layer.
   Preserves client_api_profile and checkout profile reuse. */
(function(global){
  'use strict';

  if(!global.HKProfileView){
    console.warn('[Home Kitchen] modular Profile view unavailable; legacy profile stays active');
    return;
  }

  var STORAGE_KEY='client_api_profile';

  function section(){
    return document.getElementById('profile');
  }

  function normalizedProfile(value){
    var source=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
    return {name:String(source.name||''),phone:String(source.phone||'')};
  }

  function renderProfile(){
    global.HKProfileView.render(section(),{name:profile.name,phone:profile.phone});
  }

  function loadProfileModular(){
    profile=normalizedProfile(profile);
    renderProfile();
    return profile;
  }

  function saveProfileModular(){
    var values=global.HKProfileView.values(section());
    profile=normalizedProfile(values);
    storeJson(STORAGE_KEY,profile);
    renderProfile();
    if(typeof global.toast==='function')global.toast('Профиль сохранён',false);
    else alert('Сохранено');
    return profile;
  }

  function getProfile(){return normalizedProfile(profile);}

  global.loadProfile=loadProfileModular;
  global.saveProfile=saveProfileModular;
  global.HKProfileController=Object.freeze({storageKey:STORAGE_KEY,load:loadProfileModular,save:saveProfileModular,get:getProfile});
  document.documentElement.dataset.hkProfileArchitecture='modular-v2-client-clean';
  loadProfileModular();
})(window);
/* Home Kitchen client profile — presentation layer.
   STO 6.6: renders existing profile controls only. */
(function(global){
  'use strict';

  function render(section,state){
    if(!section)return false;
    section.setAttribute('data-hk-profile-view','modular-v1');

    var name=section.querySelector('#pname');
    var phone=section.querySelector('#pphone');
    var backend=section.querySelector('#pbackend');

    if(name)name.value=state.name||'';
    if(phone)phone.value=state.phone||'';
    if(backend)backend.value=state.backendLabel||'Supabase Cloud';
    return true;
  }

  function values(section){
    if(!section)return {name:'',phone:''};
    return {
      name:(section.querySelector('#pname')?.value||'').trim(),
      phone:(section.querySelector('#pphone')?.value||'').trim()
    };
  }

  global.HKProfileView=Object.freeze({
    render:render,
    values:values
  });
})(window);
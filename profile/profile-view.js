/* Home Kitchen client profile — presentation layer.
   Client-facing profile contains only customer data. */
(function(global){
  'use strict';

  function render(section,state){
    if(!section)return false;
    section.setAttribute('data-hk-profile-view','client-clean-v2');

    var name=section.querySelector('#pname');
    var phone=section.querySelector('#pphone');

    if(name)name.value=state.name||'';
    if(phone)phone.value=state.phone||'';
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
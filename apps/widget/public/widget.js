(function(){var e={WIDGET_URL:`http://localhost:3001`,DEFAULT_ORG_ID:`org_3Jukdvr6tWj4ZOae5wNrAilrlJD`,DEFAULT_POSITION:`bottom-right`},t=`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
</svg>`,n=`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="18" y1="6" x2="6" y2="18"></line>
  <line x1="6" y1="6" x2="18" y2="18"></line>
</svg>`;(function(){let r=null,i=null,a=null,o=!1,s=null,c=e.DEFAULT_POSITION,l=document.currentScript;if(l)s=l.getAttribute(`data-organization-id`),c=l.getAttribute(`data-position`)||e.DEFAULT_POSITION;else{let t=document.querySelectorAll(`script[src*="embed"]`),n=Array.from(t).find(e=>e.hasAttribute(`data-organization-id`));n&&(s=n.getAttribute(`data-organization-id`),c=n.getAttribute(`data-position`)||e.DEFAULT_POSITION)}if(!s){console.error(`FluxSupport Widget: data-organization-id attribute is required`);return}function u(){document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,d):d()}function d(){a=document.createElement(`button`),a.id=`fluxsupport-widget-button`,a.innerHTML=t,a.style.cssText=`
      position: fixed;
      ${c===`bottom-right`?`right: 20px;`:`left: 20px;`}
      bottom: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #3b82f6;
      color: white;
      border: none;
      cursor: pointer;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 24px rgba(59, 130, 246, 0.35);
      transition: all 0.2s ease;
    `,a.addEventListener(`click`,m),a.addEventListener(`mouseenter`,()=>{a&&(a.style.transform=`scale(1.05)`)}),a.addEventListener(`mouseleave`,()=>{a&&(a.style.transform=`scale(1)`)}),document.body.appendChild(a),i=document.createElement(`div`),i.id=`fluxsupport-widget-container`,i.style.cssText=`
      position: fixed;
      ${c===`bottom-right`?`right: 20px;`:`left: 20px;`}
      bottom: 90px;
      width: 400px;
      height: 600px;
      max-width: calc(100vw - 40px);
      max-height: calc(100vh - 110px);
      z-index: 999998;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.15);
      display: none;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.3s ease;
    `,r=document.createElement(`iframe`),r.src=f(),r.style.cssText=`
      width: 100%;
      height: 100%;
      border: none;
    `,r.allow=`microphone; clipboard-read; clipboard-write`,i.appendChild(r),document.body.appendChild(i),window.addEventListener(`message`,p)}function f(){let t=new URLSearchParams;return t.append(`organizationId`,s),`${e.WIDGET_URL}?${t.toString()}`}function p(t){if(t.origin!==new URL(e.WIDGET_URL).origin)return;let{type:n,payload:r}=t.data;switch(n){case`close`:g();break;case`resize`:r.height&&i&&(i.style.height=`${r.height}px`)}}function m(){o?g():h()}function h(){i&&a&&(o=!0,i.style.display=`block`,setTimeout(()=>{i&&(i.style.opacity=`1`,i.style.transform=`translateY(0)`)},10),a.innerHTML=n)}function g(){i&&a&&(o=!1,i.style.opacity=`0`,i.style.transform=`translateY(10px)`,setTimeout(()=>{i&&(i.style.display=`none`)},300),a.innerHTML=t,a.style.background=`#3b82f6`)}function _(){window.removeEventListener(`message`,p),i&&(i.remove(),i=null,r=null),a&&=(a.remove(),null),o=!1}function v(e){_(),e.organizationId&&(s=e.organizationId),e.position&&(c=e.position),u()}window.FluxSupportWidget={init:v,show:h,hide:g,destroy:_},u()})()})();
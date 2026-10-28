// Observación de solo lectura: nunca crea nodos, cambia atributos ni envía mensajes de WhatsApp.
(() => {
  let last = null;
  let timer;
  function read(force=false) {
    const header = document.querySelector('#main header')||document.querySelector('[data-testid="conversation-header"]')||document.querySelector('[data-testid="conversation-panel-wrapper"] header')||document.querySelector('[role="main"] header')||document.querySelector('main header');
    const titleEl = header?.querySelector('[data-testid="conversation-info-header-chat-title"], [data-testid="conversation-title"]')||header?.querySelector('span[title][dir="auto"]')||header?.querySelector('span[title]')||header?.querySelector('span[dir="auto"]');
    const rawTitle = (titleEl?.getAttribute('title') || titleEl?.textContent || '').trim();
    if (!force && rawTitle === last) return;
    last = rawTitle;
    try{chrome.runtime.sendMessage({type:'WA_ACTIVE_CHAT_CHANGED',payload:{rawTitle}}).catch(()=>{});}catch{stop();}
  }
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer=setTimeout(()=>read(),200);
  });
  observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['title']});
  chrome.runtime.onMessage.addListener(message=>{if(message?.type==='CRM_READ_CHAT') read(true);});
  const polling=setInterval(()=>read(),2000);
  function stop(){observer.disconnect();clearTimeout(timer);clearInterval(polling);}
  read(true);
  window.addEventListener('pagehide',stop,{once:true});
})();

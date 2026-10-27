// Observación de solo lectura: nunca crea nodos, cambia atributos ni envía mensajes de WhatsApp.
(() => {
  let last = null;
  let timer;
  function read(force=false) {
    const header = document.querySelector('#main header');
    const titleEl = header?.querySelector('span[title][dir="auto"], span[dir="auto"]');
    const rawTitle = (titleEl?.getAttribute('title') || titleEl?.textContent || '').trim();
    if (!force && rawTitle === last) return;
    last = rawTitle;
    chrome.runtime.sendMessage({type:'WA_ACTIVE_CHAT_CHANGED',payload:{rawTitle}}).catch(()=>{});
  }
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer=setTimeout(()=>read(),200);
  });
  observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['title']});
  chrome.runtime.onMessage.addListener(message=>{if(message?.type==='CRM_READ_CHAT') read(true);});
  read(true);
  window.addEventListener('pagehide',()=>{observer.disconnect();clearTimeout(timer);},{once:true});
})();

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== 'WA_ACTIVE_CHAT_CHANGED' || !sender.tab?.id || !sender.tab.active || (sender.frameId!==undefined&&sender.frameId!==0)) return;
  try {
    if (new URL(sender.url).origin !== 'https://web.whatsapp.com') return;
  } catch { return; }
  const title = typeof message.payload?.rawTitle === 'string' ? message.payload.rawTitle.slice(0,300) : '';
  chrome.storage.session.set({ ['activeWhatsAppChat:'+sender.tab.windowId]: {
    rawTitle:title, detectedAt:new Date().toISOString(), tabId:sender.tab.id
  }}).catch(console.error);
});
chrome.tabs.onActivated.addListener(async ({tabId,windowId}) => {
  try { await chrome.tabs.sendMessage(tabId,{type:'CRM_READ_CHAT'}); }
  catch { await chrome.storage.session.set({['activeWhatsAppChat:'+windowId]:null}); }
});
chrome.tabs.onRemoved.addListener(async (tabId,info) => {
  const key='activeWhatsAppChat:'+info.windowId;
  const stored=await chrome.storage.session.get(key);
  if(stored[key]?.tabId===tabId) await chrome.storage.session.set({[key]:null});
});
chrome.tabs.onUpdated.addListener(async(tabId,change,tab)=>{
 if(change.status!=='loading')return;
 const key='activeWhatsAppChat:'+tab.windowId,stored=await chrome.storage.session.get(key);
 if(stored[key]?.tabId===tabId)await chrome.storage.session.set({[key]:null});
});
chrome.runtime.onInstalled.addListener(async()=>{
 const old=await chrome.storage.local.get(null);
 const keys=Object.keys(old).filter(key=>key.startsWith('activeWhatsAppChat:'));
 if(keys.length)await chrome.storage.local.remove(keys);
});

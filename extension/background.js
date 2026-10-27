chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== 'WA_ACTIVE_CHAT_CHANGED' || !sender.tab?.id || !sender.tab.active) return;
  try {
    if (new URL(sender.url).origin !== 'https://web.whatsapp.com') return;
  } catch { return; }
  const title = typeof message.payload?.rawTitle === 'string' ? message.payload.rawTitle.slice(0,300) : '';
  chrome.storage.local.set({ ['activeWhatsAppChat:'+sender.tab.windowId]: {
    rawTitle:title, detectedAt:new Date().toISOString(), tabId:sender.tab.id
  }}).catch(console.error);
});
chrome.tabs.onActivated.addListener(async ({tabId,windowId}) => {
  try { await chrome.tabs.sendMessage(tabId,{type:'CRM_READ_CHAT'}); }
  catch { await chrome.storage.local.set({['activeWhatsAppChat:'+windowId]:null}); }
});
chrome.tabs.onRemoved.addListener(async (tabId,info) => {
  const key='activeWhatsAppChat:'+info.windowId;
  const stored=await chrome.storage.local.get(key);
  if(stored[key]?.tabId===tabId) await chrome.storage.local.set({[key]:null});
});

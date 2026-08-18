// background.js - Service Worker (Manifest V3)
// Minimal: only handles extension icon click to trigger rescan

chrome.action.onClicked.addListener(async (tab) => {
  const url = tab.url || '';
  if (!url.includes('dev.azure.com') && !url.includes('visualstudio.com')) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'RESCAN' });
  } catch (e) {
    // Content script not ready, inject it
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['styles.css'] });
    setTimeout(() => chrome.tabs.sendMessage(tab.id, { type: 'RESCAN' }), 100);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_VERSION') {
    sendResponse({ version: chrome.runtime.getManifest().version });
  }
  return true;
});

console.log('[ADO Mermaid Viewer] Background service worker started');
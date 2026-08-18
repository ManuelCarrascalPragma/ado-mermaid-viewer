import { MessageType } from '../shared/messages.js';
import { getVersion } from '../shared/version.js';

chrome.action.onClicked.addListener(async (tab) => {
  const url = tab.url || '';
  if (!url.includes('dev.azure.com') && !url.includes('visualstudio.com')) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { type: MessageType.RESCAN });
  } catch (e) {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['styles.css'] });
    setTimeout(() => chrome.tabs.sendMessage(tab.id, { type: MessageType.RESCAN }), 100);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === MessageType.GET_VERSION) {
    sendResponse({ version: getVersion() });
  }
  return true;
});

console.log('[ADO Mermaid Viewer] Background service worker started');
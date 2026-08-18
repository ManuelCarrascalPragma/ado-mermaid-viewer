import { scanForDiagrams } from './scanner/DiagramScanner.js';
import { createMutationObserverManager } from './observers/MutationObserverManager.js';
import { createIntersectionObserverManager } from './observers/IntersectionObserverManager.js';
import { MessageType } from '../shared/messages.js';
import { getVersion } from '../shared/version.js';

let isInitialized = false;
let mutationObserver = null;
let intersectionObserver = null;

function initialize() {
  if (isInitialized) return;
  isInitialized = true;

  intersectionObserver = createIntersectionObserverManager().init();
  mutationObserver = createMutationObserverManager().init();

  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'm') {
      e.preventDefault();
      scanForDiagrams();
    }
  });

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === MessageType.RESCAN) {
      scanForDiagrams();
      sendResponse({ success: true });
    } else if (msg.type === MessageType.GET_VERSION) {
      sendResponse({ version: getVersion() });
    }
    return true;
  });

  console.log('[ADO Mermaid Viewer] Loaded (lazy mode)');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
import { scanForDiagrams } from '../scanner/DiagramScanner.js';
import { EXACT_SVG_SELECTORS, SOURCE_SELECTORS } from '../shared/constants.js';

export class MutationObserverManager {
  constructor() {
    this.observer = null;
    this.scanScheduled = false;
    this._debounceTimer = null;
  }

  init() {
    this.observer = new MutationObserver((mutations) => this.onMutations(mutations));

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return this;
  }

  onMutations(mutations) {
    if (this.scanScheduled) return;

    let shouldScan = false;
    for (const m of mutations) {
      if (m.type === 'childList' && m.addedNodes.length) {
        for (const node of m.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE &&
              !node.matches('.ado-mermaid-toolbar, .ado-mermaid-toolbar *, .ado-source-view-btn, #ado-mermaid-modal, #ado-mermaid-modal *') &&
              !node.closest('.ado-mermaid-toolbar') &&
              !node.closest('#ado-mermaid-modal')) {
            shouldScan = true;
            break;
          }
        }
      }
      if (shouldScan) break;
    }

    if (shouldScan) {
      this.scheduleScan();
    }
  }

  scheduleScan() {
    this.scanScheduled = true;
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this.scanScheduled = false;
      scanForDiagrams();
      this.reobserveNewElements();
    }, 300);
  }

  reobserveNewElements(intersectionObserver) {
    if (!intersectionObserver) return;

    EXACT_SVG_SELECTORS.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (!intersectionObserver.isObserved(el)) {
          intersectionObserver.observe(el);
        }
      });
    });

    SOURCE_SELECTORS.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (!intersectionObserver.isObserved(el)) {
          intersectionObserver.observe(el);
        }
      });
    });
  }

  disconnect() {
    this.observer?.disconnect();
    clearTimeout(this._debounceTimer);
  }
}

export function createMutationObserverManager() {
  return new MutationObserverManager();
}
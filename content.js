/*
 * Azure DevOps Mermaid Viewer
 * Author: Manuel Carrascal
 * License: MIT
 */

(function() {
  'use strict';

  const EXACT_SVG_SELECTORS = [
    'svg[id^="mermaid-diagram"]',
    'svg[aria-roledescription]'
  ];

  const SOURCE_SELECTORS = [
    'pre code.language-mermaid',
    '.file-content pre code.language-mermaid',
    '.markdown-body pre code.language-mermaid',
    '.code-block pre code.language-mermaid',
    '.wiki-edit-pane pre code',
    '[data-mermaid]'
  ];

  const MERMAID_PATTERNS = [
    /^\s*(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|pie|gantt|gitgraph|journey|timeline|mindmap|quadrantChart|requirement|erDiagram|C4Context|C4Container|C4Component|C4Dynamic|block-beta)/i,
    /^\s*```mermaid/i
  ];

  let observer = null;
  let intersectionObserver = null;
  const processedElements = new WeakSet();
  const processedContainers = new WeakSet();
  let mermaidLoaded = false;
  let isScanning = false;
  let scanScheduled = false;

  const isMermaidCode = (text) => {
    if (!text || typeof text !== 'string') return false;
    const t = text.trim();
    return t.length >= 5 && (t.startsWith('```mermaid') || MERMAID_PATTERNS.some(p => p.test(t)));
  };

  const extractMermaidCode = (text) => {
    if (!text) return '';
    return text.trim()
      .replace(/^```\s*mermaid\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/&/g, '&')
      .replace(/"/g, '"')
      .replace(/'/g, "'");
  };

  async function loadMermaid() {
    if (mermaidLoaded && window.mermaid) return;
    if (window.mermaid) {
      window.mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
      mermaidLoaded = true;
      return;
    }
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = chrome.runtime.getURL('lib/mermaid.min.js');
      s.onload = () => {
        if (window.mermaid) {
          window.mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
          mermaidLoaded = true;
          resolve();
        } else reject(new Error('Mermaid not exposed'));
      };
      s.onerror = () => reject(new Error('Failed to load Mermaid'));
      document.head.appendChild(s);
    });
  }

  class PanZoom {
    constructor(svgElement, options = {}) {
      this.svg = svgElement;
      this.wrapper = svgElement.parentElement;
      this.scale = 1;
      this.minScale = options.minScale || 0.1;
      this.maxScale = options.maxScale || 10;
      this.panX = 0;
      this.panY = 0;
      this.isPanning = false;
      this.startX = 0;
      this.startY = 0;
      this.init();
    }

    init() {
      if (!this.svg.viewBox.baseVal.width) {
        const bbox = this.svg.getBBox();
        this.svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
      }

      this.wrapper.style.position = 'relative';
      this.wrapper.style.overflow = 'hidden';
      this.wrapper.style.touchAction = 'none';
      this.svg.style.transformOrigin = '0 0';
      this.svg.style.transition = 'transform 0.1s ease-out';
      this.svg.style.cursor = 'grab';
      this.wrapper.style.setProperty('--zoom-hint', 'zoom-in');

      this.scale = 1;
      this.panX = 0;
      this.panY = 0;
      this.applyTransform();

      this.bindEvents();
    }

    bindEvents() {
      this.wrapper.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
      this.svg.addEventListener('mousedown', (e) => this.onMouseDown(e));
      window.addEventListener('mousemove', (e) => this.onMouseMove(e));
      window.addEventListener('mouseup', () => this.onMouseUp());
      this.svg.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
      this.svg.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
      this.svg.addEventListener('touchend', () => this.onTouchEnd());
      this.svg.addEventListener('dblclick', () => this.reset());
      this.svg.addEventListener('contextmenu', (e) => e.preventDefault());

      const onKeyDown = (e) => { if (e.ctrlKey || e.metaKey) this.wrapper.style.cursor = 'zoom-in'; };
      const onKeyUp = (e) => { if (!e.ctrlKey && !e.metaKey) this.wrapper.style.cursor = 'grab'; };
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      this._keyDownHandler = onKeyDown;
      this._keyUpHandler = onKeyUp;
    }

    onWheel(e) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = this.wrapper.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(this.maxScale, Math.max(this.minScale, this.scale * delta));

      const scaleRatio = newScale / this.scale;
      this.panX = mouseX - (mouseX - this.panX) * scaleRatio;
      this.panY = mouseY - (mouseY - this.panY) * scaleRatio;
      this.scale = newScale;
      this.applyTransform();
    }

    onMouseDown(e) {
      if (e.button !== 0) return;
      e.preventDefault();
      this.isPanning = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
      this.svg.style.cursor = 'grabbing';
    }

    onMouseMove(e) {
      if (!this.isPanning) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
      this.applyTransform();
    }

    onMouseUp() {
      this.isPanning = false;
      this.svg.style.cursor = 'grab';
    }

    onTouchStart(e) {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      this.isPanning = true;
      this.startX = e.touches[0].clientX - this.panX;
      this.startY = e.touches[0].clientY - this.panY;
    }

    onTouchMove(e) {
      if (!this.isPanning || e.touches.length !== 1) return;
      e.preventDefault();
      this.panX = e.touches[0].clientX - this.startX;
      this.panY = e.touches[0].clientY - this.startY;
      this.applyTransform();
    }

    onTouchEnd() {
      this.isPanning = false;
    }

    applyTransform() {
      this.svg.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
    }

    zoomIn() { this.scale = Math.min(this.maxScale, this.scale * 1.2); this.applyTransform(); }
    zoomOut() { this.scale = Math.max(this.minScale, this.scale / 1.2); this.applyTransform(); }
    reset() {
      this.scale = 1;
      this.panX = 0;
      this.panY = 0;
      this.applyTransform();
    }

    fit() {
      const rect = this.wrapper.getBoundingClientRect();
      const vb = this.svg.viewBox.baseVal;
      if (!vb.width || !vb.height) return;

      const scaleX = rect.width / vb.width;
      const scaleY = rect.height / vb.height;
      this.scale = Math.min(scaleX, scaleY) * 0.95;
      this.panX = (rect.width - vb.width * this.scale) / 2;
      this.panY = (rect.height - vb.height * this.scale) / 2;
      this.applyTransform();
    }

    destroy() {
      this.svg.style.transform = '';
      this.svg.style.cursor = '';
      this.svg.style.transition = '';
      this.wrapper.style.cursor = '';
      if (this._keyDownHandler) window.removeEventListener('keydown', this._keyDownHandler);
      if (this._keyUpHandler) window.removeEventListener('keyup', this._keyUpHandler);
    }
  }

  function createToolbar(container, panZoomInstance, svgElement, mermaidCode) {
    if (container.querySelector('.ado-mermaid-toolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'ado-mermaid-toolbar';
    toolbar.innerHTML = `
      <button class="ado-btn" data-action="zoom-in" title="Zoom In (+)" aria-label="Zoom In">+</button>
      <button class="ado-btn" data-action="zoom-out" title="Zoom Out (-)" aria-label="Zoom Out">−</button>
      <button class="ado-btn" data-action="reset" title="Reset (100%)" aria-label="Reset">⌂</button>
      <button class="ado-btn ado-btn-fullscreen" data-action="fullscreen" title="Fullscreen (F)" aria-label="Fullscreen">⛶</button>
    `;

    container.style.position = 'relative';
    container.appendChild(toolbar);

    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('.ado-btn');
      if (!btn) return;
      e.stopPropagation();

      const action = btn.dataset.action;
      switch (action) {
        case 'zoom-in': panZoomInstance?.zoomIn(); break;
        case 'zoom-out': panZoomInstance?.zoomOut(); break;
        case 'reset': panZoomInstance?.reset(); break;
        case 'fullscreen': openFullscreenModal(svgElement, mermaidCode); break;
      }
    });
  }

  let modalPanZoom = null;
  let modalSvg = null;

  function createModal() {
    const modal = document.createElement('div');
    modal.id = 'ado-mermaid-modal';
    modal.className = 'ado-mermaid-modal';
    modal.innerHTML = `
      <div class="ado-modal-backdrop"></div>
      <div class="ado-modal-content">
        <header class="ado-modal-header">
          <h3>Mermaid Diagram</h3>
          <div class="ado-modal-toolbar">
            <button class="ado-btn" data-action="zoom-in" aria-label="Zoom In">+</button>
            <button class="ado-btn" data-action="zoom-out" aria-label="Zoom Out">−</button>
            <button class="ado-btn" data-action="reset" aria-label="Reset">⌂</button>
            <button class="ado-btn" data-action="download" aria-label="Download PNG">⬇</button>
            <button class="ado-btn" data-action="close" aria-label="Close (Esc)">✕</button>
          </div>
        </header>
        <div class="ado-modal-body">
          <div class="ado-modal-svg-wrapper"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    bindModalEvents(modal);
    return modal;
  }

  function bindModalEvents(modal) {
    const close = () => {
      modal.remove();
      document.body.style.overflow = '';
      if (modalPanZoom) { modalPanZoom.destroy(); modalPanZoom = null; }
    };

    modal.querySelector('.ado-modal-backdrop').addEventListener('click', close);
    modal.querySelector('[data-action="close"]').addEventListener('click', close);
    modal.querySelector('[data-action="zoom-in"]').addEventListener('click', () => modalPanZoom?.zoomIn());
    modal.querySelector('[data-action="zoom-out"]').addEventListener('click', () => modalPanZoom?.zoomOut());
    modal.querySelector('[data-action="reset"]').addEventListener('click', () => modalPanZoom?.reset());
    modal.querySelector('[data-action="download"]').addEventListener('click', () => downloadSvg(modalSvg));

    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === '+' || e.key === '=') modalPanZoom?.zoomIn();
      if (e.key === '-') modalPanZoom?.zoomOut();
      if (e.key === '0') modalPanZoom?.reset();
    };
    modal.addEventListener('keydown', onKey);
    modal._keyHandler = onKey;

    modal.tabIndex = -1;
    modal.focus();
  }

  async function openFullscreenModal(svgElement, mermaidCode) {
    let modal = document.getElementById('ado-mermaid-modal');
    if (!modal) modal = createModal();

    const wrapper = modal.querySelector('.ado-modal-svg-wrapper');
    wrapper.innerHTML = '';

    modalSvg = svgElement.cloneNode(true);
    modalSvg.removeAttribute('style');
    modalSvg.style.width = '100%';
    modalSvg.style.height = '100%';
    wrapper.appendChild(modalSvg);

    requestAnimationFrame(() => {
      if (modalPanZoom) modalPanZoom.destroy();
      modalPanZoom = new PanZoom(modalSvg, { minScale: 0.05, maxScale: 20 });
      modalPanZoom.fit();
    });

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function downloadSvg(svgEl) {
    if (!svgEl) return;
    try {
      const clone = svgEl.cloneNode(true);
      clone.style.transform = '';
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clone);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mermaid-diagram-${Date.now()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download failed:', e);
    }
  }

  function findDiagramContainer(element) {
    if (element.tagName === 'SVG') {
      return element.closest('.mermaid[id]') ||
             element.closest('.wiki-mermaid-container')?.closest('.mermaid[id]') ||
             element.closest('div[class*="mermaid"]') ||
             element.parentElement;
    }
    return element.closest('pre') ||
           element.closest('.code-block') ||
           element.closest('.highlight') ||
           element.parentElement;
  }

  function addDiagramViewer(container, svgElement, mermaidCode) {
    if (!container || processedContainers.has(container)) return;
    if (container.querySelector('.ado-mermaid-toolbar')) return;

    processedContainers.add(container);

    const style = window.getComputedStyle(container);
    if (style.position === 'static') container.style.position = 'relative';

    let panZoomInstance = null;
    if (svgElement && svgElement.tagName.toUpperCase() === 'SVG') {
      panZoomInstance = new PanZoom(svgElement);
    }

    createToolbar(container, panZoomInstance, svgElement, mermaidCode);
  }

  function addSourceViewButton(element, mermaidCode) {
    if (element.querySelector('.ado-source-view-btn')) return;
    if (processedElements.has(element)) return;
    processedElements.add(element);

    const container = findDiagramContainer(element);
    if (!container) return;

    const style = window.getComputedStyle(container);
    if (style.position === 'static') container.style.position = 'relative';

    const btn = document.createElement('button');
    btn.className = 'ado-source-view-btn';
    btn.innerHTML = '🔍 View Diagram';
    btn.title = 'Open diagram in fullscreen viewer';

    Object.assign(btn.style, {
      position: 'absolute',
      top: '8px',
      right: '8px',
      zIndex: '100',
      padding: '6px 12px',
      fontSize: '12px',
      fontWeight: '500',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      background: 'var(--btn-primary-bg, #0078d4)',
      color: 'var(--btn-primary-text, white)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
      transition: 'background 0.15s, transform 0.1s'
    });

    btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.05)');
    btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      renderAndOpenModal(mermaidCode);
    });

    container.appendChild(btn);
  }

  async function renderAndOpenModal(mermaidCode) {
    await loadMermaid();
    const id = 'mermaid-' + Date.now();
    const { svg } = await window.mermaid.render(id, mermaidCode);

    const temp = document.createElement('div');
    temp.style.position = 'fixed';
    temp.style.left = '-9999px';
    temp.innerHTML = svg;
    document.body.appendChild(temp);

    const svgEl = temp.querySelector('svg');
    if (svgEl) {
      await openFullscreenModal(svgEl, mermaidCode);
    }
    temp.remove();
  }

  function scanForDiagrams() {
    if (isScanning) return;
    isScanning = true;

    let count = 0;

    EXACT_SVG_SELECTORS.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(svgEl => {
          if (svgEl.tagName.toUpperCase() !== 'SVG') return;
          if (processedElements.has(svgEl)) return;
          if (svgEl.closest('.ado-mermaid-toolbar') || svgEl.closest('#ado-mermaid-modal')) return;

          const container = findDiagramContainer(svgEl);
          const code = '%% Preview mode - source not available %%';
          addDiagramViewer(container, svgEl, code);
          if (container) count++;
        });
      } catch (e) { /* ignore */ }
    });

    SOURCE_SELECTORS.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          if (processedElements.has(el)) return;
          if (el.classList.contains('mermaid') && el.tagName === 'DIV' && el.id) return;
          if (el.closest('.ado-mermaid-toolbar')) return;

          const text = el.textContent || el.innerText || '';
          if (isMermaidCode(text)) {
            const code = extractMermaidCode(text);
            const container = findDiagramContainer(el);
            addSourceViewButton(el, code);
            count++;
          }
        });
      } catch (e) { /* ignore */ }
    });

    document.querySelectorAll('.wiki-page-content, .wiki-content, .markdown-body, .wiki-edit-pane').forEach(container => {
      const html = container.innerHTML;
      const matches = html.match(/::: *mermaid\s*([\s\S]*?):::/gi);
      if (matches) {
        matches.forEach(match => {
          const code = match.replace(/::: *mermaid\s*/i, '').replace(/\s*:::\s*$/i, '').trim();
          if (code && isMermaidCode(code)) {
            const textNodes = getTextNodes(container);
            textNodes.forEach(node => {
              if (node.textContent.includes(code.substring(0, 50)) && !processedElements.has(node.parentElement)) {
                addSourceViewButton(node.parentElement, code);
                count++;
              }
            });
          }
        });
      }
    });

    isScanning = false;
    return count;
  }

  function getTextNodes(element) {
    const nodes = [];
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.trim()) nodes.push(node);
    }
    return nodes;
  }

  function initIntersectionObserver() {
    intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target;
          
          if (target.tagName.toUpperCase() === 'SVG') {
            if (!processedElements.has(target)) {
              const container = findDiagramContainer(target);
              const code = '%% Preview mode - source not available %%';
              addDiagramViewer(container, target, code);
            }
            intersectionObserver.unobserve(target);
            return;
          }

          if (target.matches(SOURCE_SELECTORS.join(', '))) {
            const text = target.textContent || target.innerText || '';
            if (isMermaidCode(text) && !processedElements.has(target)) {
              const code = extractMermaidCode(text);
              const container = findDiagramContainer(target);
              addSourceViewButton(target, code);
            }
            intersectionObserver.unobserve(target);
          }
        }
      });
    }, {
      rootMargin: '200px',
      threshold: 0.01
    });

    EXACT_SVG_SELECTORS.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => intersectionObserver.observe(el));
    });
    SOURCE_SELECTORS.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => intersectionObserver.observe(el));
    });
    document.querySelectorAll('.wiki-page-content, .wiki-content, .markdown-body, .wiki-edit-pane').forEach(el => {
      intersectionObserver.observe(el);
    });
  }

  function initMutationObserver() {
    observer = new MutationObserver((mutations) => {
      if (scanScheduled) return;
      
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
        scanScheduled = true;
        clearTimeout(observer._debounce);
        observer._debounce = setTimeout(() => {
          scanScheduled = false;
          scanForDiagrams();
          if (intersectionObserver) {
            EXACT_SVG_SELECTORS.forEach(sel => {
              document.querySelectorAll(sel).forEach(el => {
                if (!processedElements.has(el)) intersectionObserver.observe(el);
              });
            });
            SOURCE_SELECTORS.forEach(sel => {
              document.querySelectorAll(sel).forEach(el => {
                if (!processedElements.has(el)) intersectionObserver.observe(el);
              });
            });
          }
        }, 300);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  let isInitialized = false;

  function initialize() {
    if (isInitialized) return;
    isInitialized = true;

    initIntersectionObserver();
    initMutationObserver();

    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        scanForDiagrams();
      }
    });

    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.type === 'RESCAN') {
        scanForDiagrams();
        sendResponse({ success: true });
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
})();
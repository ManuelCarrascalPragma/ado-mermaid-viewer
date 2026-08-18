import { createElement } from '../utils/dom.js';
import { extractMermaidCode } from '../utils/html.js';

export class Toolbar {
  constructor(container, panZoomInstance, svgElement, mermaidCode) {
    this.container = container;
    this.panZoom = panZoomInstance;
    this.svgElement = svgElement;
    this.mermaidCode = mermaidCode;
    this.element = null;
    this.modalOpener = null;
    this.init();
  }

  init() {
    if (this.container.querySelector('.ado-mermaid-toolbar')) return;

    this.element = createElement(`
      <div class="ado-mermaid-toolbar">
        <button class="ado-btn" data-action="zoom-in" title="Zoom In (+)" aria-label="Zoom In">+</button>
        <button class="ado-btn" data-action="zoom-out" title="Zoom Out (-)" aria-label="Zoom Out">−</button>
        <button class="ado-btn" data-action="reset" title="Reset (100%)" aria-label="Reset">⌂</button>
        <button class="ado-btn ado-btn-fullscreen" data-action="fullscreen" title="Fullscreen (F)" aria-label="Fullscreen">⛶</button>
      </div>
    `);

    this.container.style.position = 'relative';
    this.container.appendChild(this.element);

    this.element.addEventListener('click', (e) => this.onClick(e));
  }

  onClick(e) {
    const btn = e.target.closest('.ado-btn');
    if (!btn) return;
    e.stopPropagation();

    const action = btn.dataset.action;
    switch (action) {
      case 'zoom-in': this.panZoom?.zoomIn(); break;
      case 'zoom-out': this.panZoom?.zoomOut(); break;
      case 'reset': this.panZoom?.reset(); break;
      case 'fullscreen': this.modalOpener?.(); break;
    }
  }

  setModalOpener(opener) {
    this.modalOpener = opener;
  }

  destroy() {
    this.element?.remove();
    this.element = null;
  }
}

export function createToolbar(container, panZoomInstance, svgElement, mermaidCode) {
  return new Toolbar(container, panZoomInstance, svgElement, mermaidCode);
}
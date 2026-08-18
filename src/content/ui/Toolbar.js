import { createElement } from '../utils/dom.js';
import { createIcon, ZoomIn, ZoomOut, Home, Maximize } from '../utils/icons.js';
import { PanZoom } from './PanZoom.js';
import { openFullscreenModal } from './Modal.js';

export class Toolbar {
  constructor(container, svgElement, mermaidCode) {
    this.container = container;
    this.svgElement = svgElement;
    this.mermaidCode = mermaidCode;
    this.element = null;
    this.modalOpener = null;
    this.panZoom = null;
    this.init();
  }

  init() {
    if (this.container.querySelector('.ado-mermaid-toolbar')) return;

    this.panZoom = new PanZoom(this.svgElement, { minScale: 0.05, maxScale: 20 });

    this.element = createElement(`
      <div class="ado-mermaid-toolbar">
        <button class="ado-btn" data-action="zoom-in" title="Zoom In (+)" aria-label="Zoom In">
          ${createIcon(ZoomIn)}
        </button>
        <button class="ado-btn" data-action="zoom-out" title="Zoom Out (-)" aria-label="Zoom Out">
          ${createIcon(ZoomOut)}
        </button>
        <button class="ado-btn" data-action="reset" title="Reset (100%)" aria-label="Reset">
          ${createIcon(Home)}
        </button>
        <button class="ado-btn ado-btn-fullscreen" data-action="fullscreen" title="Fullscreen (F)" aria-label="Fullscreen">
          ${createIcon(Maximize)}
        </button>
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
    this.panZoom?.destroy();
    this.panZoom = null;
    this.element?.remove();
    this.element = null;
  }
}

export function createToolbar(container, svgElement, mermaidCode) {
  return new Toolbar(container, svgElement, mermaidCode);
}

export function addDiagramViewer(container, svgElement, mermaidCode) {
  if (!container || !svgElement) return;
  const toolbar = new Toolbar(container, svgElement, mermaidCode);
  toolbar.setModalOpener(() => openFullscreenModal(svgElement, mermaidCode));
  return toolbar;
}
import { createElement } from '../utils/dom.js';

let modalInstance = null;
let modalPanZoom = null;
let modalSvg = null;

export class Modal {
  constructor() {
    this.element = null;
    this.wrapper = null;
    this.modalPanZoom = null;
    this.modalSvg = null;
  }

  static getInstance() {
    if (!modalInstance) modalInstance = new Modal();
    return modalInstance;
  }

  static destroyInstance() {
    if (modalInstance) {
      modalInstance.close();
      modalInstance = null;
    }
  }

  init() {
    if (this.element) return this.element;

    this.element = createElement(`
      <div id="ado-mermaid-modal" class="ado-mermaid-modal">
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
      </div>
    `);

    document.body.appendChild(this.element);
    this.wrapper = this.element.querySelector('.ado-modal-svg-wrapper');
    this.bindEvents();
    return this.element;
  }

  bindEvents() {
    const close = () => this.close();

    this.element.querySelector('.ado-modal-backdrop').addEventListener('click', close);
    this.element.querySelector('[data-action="close"]').addEventListener('click', close);
    this.element.querySelector('[data-action="zoom-in"]').addEventListener('click', () => this.modalPanZoom?.zoomIn());
    this.element.querySelector('[data-action="zoom-out"]').addEventListener('click', () => this.modalPanZoom?.zoomOut());
    this.element.querySelector('[data-action="reset"]').addEventListener('click', () => this.modalPanZoom?.reset());
    this.element.querySelector('[data-action="download"]').addEventListener('click', () => this.download());

    this._keyHandler = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === '+' || e.key === '=') this.modalPanZoom?.zoomIn();
      if (e.key === '-') this.modalPanZoom?.zoomOut();
      if (e.key === '0') this.modalPanZoom?.reset();
    };
    this.element.addEventListener('keydown', this._keyHandler);

    this.element.tabIndex = -1;
  }

  async open(svgElement, mermaidCode) {
    this.init();

    this.wrapper.innerHTML = '';
    this.modalSvg = svgElement.cloneNode(true);
    this.modalSvg.removeAttribute('style');
    this.modalSvg.style.width = '100%';
    this.modalSvg.style.height = '100%';
    this.wrapper.appendChild(this.modalSvg);

    await new Promise(r => requestAnimationFrame(r));

    if (this.modalPanZoom) this.modalPanZoom.destroy();
    this.modalPanZoom = new PanZoom(this.modalSvg, { minScale: 0.05, maxScale: 20 });
    this.modalPanZoom.fit();

    this.element.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    this.element.focus();
  }

  close() {
    if (!this.element) return;
    this.element.remove();
    this.element = null;
    this.wrapper = null;
    document.body.style.overflow = '';
    if (this.modalPanZoom) {
      this.modalPanZoom.destroy();
      this.modalPanZoom = null;
    }
    this.modalSvg = null;
  }

  download() {
    if (!this.modalSvg) return;
    try {
      const clone = this.modalSvg.cloneNode(true);
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

  destroy() {
    this.close();
  }
}

export function openFullscreenModal(svgElement, mermaidCode) {
  const modal = Modal.getInstance();
  modal.open(svgElement, mermaidCode);
}
import { createElement } from '../utils/dom.js';
import { findDiagramContainer } from '../utils/dom.js';
import { renderMermaid } from '../renderer/MermaidRenderer.js';

const processedElements = new WeakSet();

export class SourceViewButton {
  constructor(element, mermaidCode) {
    this.element = element;
    this.mermaidCode = mermaidCode;
    this.button = null;
    this.container = null;
    this.init();
  }

  init() {
    if (processedElements.has(this.element)) return;
    if (this.element.querySelector('.ado-source-view-btn')) return;

    this.container = findDiagramContainer(this.element);
    if (!this.container) return;

    processedElements.add(this.element);

    const style = window.getComputedStyle(this.container);
    if (style.position === 'static') this.container.style.position = 'relative';

    this.button = createElement(`
      <button class="ado-source-view-btn" title="Open diagram in fullscreen viewer">🔍 View Diagram</button>
    `);

    this.button.addEventListener('mouseenter', () => this.button.style.transform = 'scale(1.05)');
    this.button.addEventListener('mouseleave', () => this.button.style.transform = 'scale(1)');
    this.button.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openModal();
    });

    this.container.appendChild(this.button);
  }

  async openModal() {
    const { svg } = await renderMermaid(this.mermaidCode);

    const temp = document.createElement('div');
    temp.style.position = 'fixed';
    temp.style.left = '-9999px';
    temp.innerHTML = svg;
    document.body.appendChild(temp);

    const svgEl = temp.querySelector('svg');
    if (svgEl) {
      const { openFullscreenModal } = await import('./Modal.js');
      openFullscreenModal(svgEl, this.mermaidCode);
    }
    temp.remove();
  }

  destroy() {
    this.button?.remove();
    this.button = null;
    processedElements.delete(this.element);
  }
}

export function createSourceViewButton(element, mermaidCode) {
  return new SourceViewButton(element, mermaidCode);
}
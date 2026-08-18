import { EXACT_SVG_SELECTORS, SOURCE_SELECTORS, CONTAINER_SELECTORS } from '../../shared/constants.js';
import { isMermaidCode, extractMermaidCode } from '../utils/html.js';
import { addDiagramViewer } from '../ui/Toolbar.js';
import { createSourceViewButton } from '../ui/SourceViewButton.js';

const processedElements = new WeakSet();
const processedContainers = new WeakSet();

export class IntersectionObserverManager {
  constructor() {
    this.observer = null;
    this.isObserved = new WeakSet();
  }

  init() {
    this.observer = new IntersectionObserver((entries) => this.onIntersect(entries), {
      rootMargin: '200px',
      threshold: 0.01
    });

    this.observeInitialElements();
    return this;
  }

  observeInitialElements() {
    EXACT_SVG_SELECTORS.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => this.observe(el));
    });

    SOURCE_SELECTORS.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => this.observe(el));
    });

    CONTAINER_SELECTORS.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => this.observe(el));
    });
  }

  observe(element) {
    if (!element || this.isObserved.has(element)) return;
    this.observer.observe(element);
    this.isObserved.add(element);
  }

  unobserve(element) {
    if (!element) return;
    this.observer.unobserve(element);
    this.isObserved.delete(element);
  }

  onIntersect(entries) {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const target = entry.target;

      if (target.tagName.toUpperCase() === 'SVG') {
        if (!processedElements.has(target)) {
          const container = findDiagramContainer(target);
          const code = '%% Preview mode - source not available %%';
          addDiagramViewer(container, target, code);
        }
        this.unobserve(target);
        return;
      }

      if (target.matches(SOURCE_SELECTORS.join(', '))) {
        const text = target.textContent || target.innerText || '';
        if (isMermaidCode(text) && !processedElements.has(target)) {
          const code = extractMermaidCode(text);
          const container = findDiagramContainer(target);
          createSourceViewButton(target, code);
        }
        this.unobserve(target);
      }
    });
  }

  disconnect() {
    this.observer?.disconnect();
    this.isObserved = new WeakSet();
  }
}

export function createIntersectionObserverManager() {
  return new IntersectionObserverManager();
}

function findDiagramContainer(element) {
  if (element.tagName === 'SVG') {
    return (
      element.closest('.mermaid[id]') ||
      element.closest('.wiki-mermaid-container')?.closest('.mermaid[id]') ||
      element.closest('div[class*="mermaid"]') ||
      element.parentElement
    );
  }
  return (
    element.closest('pre') ||
    element.closest('.code-block') ||
    element.closest('.highlight') ||
    element.parentElement
  );
}
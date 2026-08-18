import { EXACT_SVG_SELECTORS, SOURCE_SELECTORS, CONTAINER_SELECTORS, MERMAID_PATTERNS } from '../shared/constants.js';
import { isMermaidCode, extractMermaidCode } from '../utils/html.js';
import { getTextNodes } from '../utils/dom.js';
import { addDiagramViewer } from '../ui/Toolbar.js';
import { createSourceViewButton } from '../ui/SourceViewButton.js';

const processedElements = new WeakSet();
const processedContainers = new WeakSet();
let isScanning = false;

export function scanForDiagrams() {
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
          createSourceViewButton(el, code);
          count++;
        }
      });
    } catch (e) { /* ignore */ }
  });

  CONTAINER_SELECTORS.forEach(containerSelector => {
    document.querySelectorAll(containerSelector).forEach(container => {
      const html = container.innerHTML;
      const matches = html.match(/::: *mermaid\s*([\s\S]*?):::/gi);
      if (matches) {
        matches.forEach(match => {
          const code = match.replace(/::: *mermaid\s*/i, '').replace(/\s*:::\s*$/i, '').trim();
          if (code && isMermaidCode(code)) {
            const textNodes = getTextNodes(container);
            textNodes.forEach(node => {
              if (node.textContent.includes(code.substring(0, 50)) && !processedElements.has(node.parentElement)) {
                createSourceViewButton(node.parentElement, code);
                count++;
              }
            });
          }
        });
      }
    });
  });

  isScanning = false;
  return count;
}

export function findDiagramContainer(element) {
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

export function isScanningActive() {
  return isScanning;
}

export function resetScanner() {
  processedElements.clear();
  processedContainers.clear();
  isScanning = false;
}
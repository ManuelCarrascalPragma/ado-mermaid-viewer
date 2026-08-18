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

export function getTextNodes(element) {
  const nodes = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  let node;
  while ((node = walker.nextNode())) {
    if (node.textContent.trim()) nodes.push(node);
  }
  return nodes;
}

export function setPositionRelative(element) {
  if (!element) return;
  const style = window.getComputedStyle(element);
  if (style.position === 'static') {
    element.style.position = 'relative';
  }
}

export function createElement(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}
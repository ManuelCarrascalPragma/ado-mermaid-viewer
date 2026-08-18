export const EXACT_SVG_SELECTORS = [
  'svg[id^="mermaid-diagram"]',
  'svg[aria-roledescription]'
];

export const SOURCE_SELECTORS = [
  'pre code.language-mermaid',
  '.file-content pre code.language-mermaid',
  '.markdown-body pre code.language-mermaid',
  '.code-block pre code.language-mermaid',
  '.wiki-edit-pane pre code',
  '[data-mermaid]'
];

export const MERMAID_PATTERNS = [
  /^\s*(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|pie|gantt|gitgraph|journey|timeline|mindmap|quadrantChart|requirement|erDiagram|C4Context|C4Container|C4Component|C4Dynamic|block-beta)/i,
  /^\s*```mermaid/i
];

export const CONTAINER_SELECTORS = [
  '.wiki-page-content',
  '.wiki-content',
  '.markdown-body',
  '.wiki-edit-pane'
];

export const MERMAID_RENDER_OPTIONS = {
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose'
};
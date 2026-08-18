const ENTITY_MAP = {
  '<': '<',
  '>': '>',
  '&': '&',
  '"': '"',
  "'": "'"
};

const REVERSE_ENTITY_MAP = Object.fromEntries(
  Object.entries(ENTITY_MAP).map(([k, v]) => [v, k])
);

export function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[<>&"']/g, char => ENTITY_MAP[char]);
}

export function unescapeHtml(text) {
  if (!text) return '';
  return text.replace(/&(?:lt|gt|amp|quot|#39);/g, entity => REVERSE_ENTITY_MAP[entity]);
}

export function extractMermaidCode(text) {
  if (!text) return '';
  return text.trim()
    .replace(/^```\s*mermaid\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/&/g, '&')
    .replace(/"/g, '"')
    .replace(/'/g, "'");
}

export function isMermaidCode(text) {
  if (!text) return false;
  const patterns = [
    /^\s*(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|pie|gantt|gitgraph|journey|timeline|mindmap|quadrantChart|requirement|erDiagram|C4Context|C4Container|C4Component|C4Dynamic|block-beta)/i,
    /^\s*```mermaid/i
  ];
  return patterns.some(p => p.test(text));
}
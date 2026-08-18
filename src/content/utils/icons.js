export {
  ZoomIn,
  ZoomOut,
  Home,
  Maximize,
  Minimize2,
  Download,
  X,
  Search
} from 'lucide';

export function createIcon(iconData, size = 16) {
  const attrs = [
    'width', 'height', 'viewBox', 'fill', 'stroke',
    'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'class'
  ];
  const values = [
    size, size, '0 0 24 24', 'none', 'currentColor',
    '2', 'round', 'round', 'ado-icon'
  ];
  const svgAttrs = attrs.map((a, i) => `${a}="${values[i]}"`).join(' ');

  const paths = iconData.map(([elementName, attributes]) => {
    const attrsStr = Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    return `<${elementName} ${attrsStr} />`;
  }).join('');

  return `<svg ${svgAttrs}>${paths}</svg>`;
}
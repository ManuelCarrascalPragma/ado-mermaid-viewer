export class PanZoom {
  constructor(svgElement, options = {}) {
    this.svg = svgElement;
    this.wrapper = svgElement.parentElement;
    this.scale = 1;
    this.minScale = options.minScale ?? 0.1;
    this.maxScale = options.maxScale ?? 10;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.startX = 0;
    this.startY = 0;
    this._keyDownHandler = null;
    this._keyUpHandler = null;
    this.init();
  }

  init() {
    if (!this.svg.viewBox?.baseVal?.width) {
      const bbox = this.svg.getBBox();
      this.svg.setAttribute('viewBox', `${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}`);
    }

    this.wrapper.style.position = 'relative';
    this.wrapper.style.overflow = 'hidden';
    this.wrapper.style.touchAction = 'none';
    this.svg.style.transformOrigin = '0 0';
    this.svg.style.transition = `transform ${getComputedStyle(document.documentElement).getPropertyValue('--ado-transition-fast') || '0.1s'} ease-out`;
    this.svg.style.cursor = 'grab';
    this.wrapper.style.setProperty('--zoom-hint', 'zoom-in');

    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
    this.applyTransform();

    this.bindEvents();
  }

  bindEvents() {
    this.wrapper.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    this.svg.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', () => this.onMouseUp());
    this.svg.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    this.svg.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    this.svg.addEventListener('touchend', () => this.onTouchEnd());
    this.svg.addEventListener('dblclick', () => this.reset());
    this.svg.addEventListener('contextmenu', (e) => e.preventDefault());

    this._keyDownHandler = (e) => { if (e.ctrlKey || e.metaKey) this.wrapper.style.cursor = 'zoom-in'; };
    this._keyUpHandler = (e) => { if (!e.ctrlKey && !e.metaKey) this.wrapper.style.cursor = 'grab'; };
    window.addEventListener('keydown', this._keyDownHandler);
    window.addEventListener('keyup', this._keyUpHandler);
  }

  onWheel(e) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const rect = this.wrapper.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(this.maxScale, Math.max(this.minScale, this.scale * delta));

    const scaleRatio = newScale / this.scale;
    this.panX = mouseX - (mouseX - this.panX) * scaleRatio;
    this.panY = mouseY - (mouseY - this.panY) * scaleRatio;
    this.scale = newScale;
    this.applyTransform();
  }

  onMouseDown(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    this.isPanning = true;
    this.startX = e.clientX - this.panX;
    this.startY = e.clientY - this.panY;
    this.svg.style.cursor = 'grabbing';
  }

  onMouseMove(e) {
    if (!this.isPanning) return;
    this.panX = e.clientX - this.startX;
    this.panY = e.clientY - this.startY;
    this.applyTransform();
  }

  onMouseUp() {
    this.isPanning = false;
    this.svg.style.cursor = 'grab';
  }

  onTouchStart(e) {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    this.isPanning = true;
    this.startX = e.touches[0].clientX - this.panX;
    this.startY = e.touches[0].clientY - this.panY;
  }

  onTouchMove(e) {
    if (!this.isPanning || e.touches.length !== 1) return;
    e.preventDefault();
    this.panX = e.touches[0].clientX - this.startX;
    this.panY = e.touches[0].clientY - this.startY;
    this.applyTransform();
  }

  onTouchEnd() {
    this.isPanning = false;
  }

  applyTransform() {
    this.svg.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
  }

  zoomIn() { this.scale = Math.min(this.maxScale, this.scale * 1.2); this.applyTransform(); }
  zoomOut() { this.scale = Math.max(this.minScale, this.scale / 1.2); this.applyTransform(); }
  reset() {
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
    this.applyTransform();
  }

  fit() {
    const rect = this.wrapper.getBoundingClientRect();
    const vb = this.svg.viewBox?.baseVal;
    if (!vb?.width || !vb?.height) return;

    const scaleX = rect.width / vb.width;
    const scaleY = rect.height / vb.height;
    this.scale = Math.min(scaleX, scaleY) * 0.95;
    this.panX = (rect.width - vb.width * this.scale) / 2;
    this.panY = (rect.height - vb.height * this.scale) / 2;
    this.applyTransform();
  }

  destroy() {
    this.svg.style.transform = '';
    this.svg.style.cursor = '';
    this.svg.style.transition = '';
    this.wrapper.style.cursor = '';
    if (this._keyDownHandler) window.removeEventListener('keydown', this._keyDownHandler);
    if (this._keyUpHandler) window.removeEventListener('keyup', this._keyUpHandler);
  }
}
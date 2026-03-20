// mouse-click-ray-2d.js
import AFrame from '@skybrush/aframe-components';

if (!AFrame.components['mouse-click-ray-2d']) {
  AFrame.registerComponent('mouse-click-ray-2d', {
    schema: {
      duration: { type: 'number', default: 300 }, // ms
      color: { type: 'string', default: '#ff0000' },
      length: { type: 'number', default: 220 },   // px
      width: { type: 'number', default: 2 },      // px
    },

    init() {
      this._hideTimer = null;

      const overlay = document.getElementById('click-ray-overlay');
      if (!overlay) {
        console.warn('[mouse-click-ray-2d] #click-ray-overlay not found');
        return;
      }
      this._overlay = overlay;

      // SVG/Line을 한 번만 만들고 재사용
      const svgNS = 'http://www.w3.org/2000/svg';

      this._svg = document.createElementNS(svgNS, 'svg');
      this._svg.setAttribute('width', '100%');
      this._svg.setAttribute('height', '100%');
      this._svg.style.position = 'absolute';
      this._svg.style.left = '0';
      this._svg.style.top = '0';
      this._svg.style.opacity = '0';          // 기본 숨김
      this._svg.style.willChange = 'opacity'; // 깜박임/리플로우 완화

      this._line = document.createElementNS(svgNS, 'line');
      this._line.setAttribute('stroke', this.data.color);
      this._line.setAttribute('stroke-width', String(this.data.width));
      this._line.setAttribute('stroke-linecap', 'round');

      this._svg.appendChild(this._line);
      this._overlay.appendChild(this._svg);

      // 클릭 시 업데이트만
      this._onPointerDown = (event) => {
        const sceneEl = this.el.sceneEl;
        const canvas = sceneEl?.canvas;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // 기본: 위로
        const dx = 0;
        const dy = -this.data.length;

        this._line.setAttribute('x1', String(x));
        this._line.setAttribute('y1', String(y));
        this._line.setAttribute('x2', String(x + dx));
        this._line.setAttribute('y2', String(y + dy));
        this._line.setAttribute('stroke', this.data.color);
        this._line.setAttribute('stroke-width', String(this.data.width));

        this._svg.style.opacity = '1';

        clearTimeout(this._hideTimer);
        this._hideTimer = setTimeout(() => {
          if (this._svg) this._svg.style.opacity = '0';
        }, this.data.duration);
      };

      this.el.sceneEl.addEventListener('pointerdown', this._onPointerDown, true);
    },

    update() {
      if (this._line) {
        this._line.setAttribute('stroke', this.data.color);
        this._line.setAttribute('stroke-width', String(this.data.width));
      }
    },

    remove() {
      clearTimeout(this._hideTimer);
      this.el.sceneEl?.removeEventListener('pointerdown', this._onPointerDown, true);

      if (this._svg && this._overlay) {
        this._overlay.removeChild(this._svg);
      }
      this._svg = null;
      this._line = null;
      this._overlay = null;
    },
  });
}
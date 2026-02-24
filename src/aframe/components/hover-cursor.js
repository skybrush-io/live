import AFrame from '@skybrush/aframe-components';
import * as THREE from 'three';

if (!AFrame.components['hover-cursor']) {
  AFrame.registerComponent('hover-cursor', {
    schema: {
      className: { type: 'string', default: 'three-d-clickable' },
      interval: { type: 'number', default: 50 }, // ms
      pointer: { type: 'string', default: 'pointer' },
      normal: { type: 'string', default: 'default' },
    },

    init() {
      this._raycaster = new THREE.Raycaster();
      this._mouse = new THREE.Vector2(0, 0);
      this._lastCheck = 0;
      this._hovering = false;

      this._onMouseMove = (e) => {
        const sceneEl = this.el.sceneEl;
        const canvas = sceneEl?.canvas;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();

        // 캔버스 밖이면 기본 커서
        const inside =
          e.clientX >= rect.left && e.clientX <= rect.right &&
          e.clientY >= rect.top && e.clientY <= rect.bottom;

        if (!inside) {
          this._setCursor(false);
          return;
        }

        this._mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this._mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      };

      window.addEventListener('mousemove', this._onMouseMove, { passive: true });

      // 캔버스가 늦게 생길 수 있어서 로드 후 기본 커서 세팅
      this.el.sceneEl.addEventListener('loaded', () => {
        const canvas = this.el.sceneEl?.canvas;
        if (canvas) canvas.style.cursor = this.data.normal;
      });
    },

    _collectRoots() {
      const sceneEl = this.el.sceneEl;
      const els = sceneEl.querySelectorAll(`.${this.data.className}`);
      const roots = [];
      els.forEach((el) => el?.object3D && roots.push(el.object3D));
      return roots;
    },

    _setCursor(isHover) {
      if (this._hovering === isHover) return;
      this._hovering = isHover;

      const canvas = this.el.sceneEl?.canvas;
      if (!canvas) return;
      canvas.style.cursor = isHover ? this.data.pointer : this.data.normal;
    },

    tick(time) {
      if (time - this._lastCheck < this.data.interval) return;
      this._lastCheck = time;

      const sceneEl = this.el.sceneEl;
      const canvas = sceneEl?.canvas;
      const camera = sceneEl?.camera;
      if (!canvas || !camera) return;

      this._raycaster.setFromCamera(this._mouse, camera);

      const roots = this._collectRoots();
      const hits = this._raycaster.intersectObjects(roots, true);

      this._setCursor(hits.length > 0);
    },

    remove() {
      window.removeEventListener('mousemove', this._onMouseMove);
      const canvas = this.el.sceneEl?.canvas;
      if (canvas) canvas.style.cursor = 'default';
    },
  });
}
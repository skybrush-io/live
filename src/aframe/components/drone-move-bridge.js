import AFrame from '@skybrush/aframe-components';

if (!AFrame.components['drone-move-bridge']) {
  AFrame.registerComponent('drone-move-bridge', {
    init() {
      this._onMove = this._onMove.bind(this);
      window.addEventListener('drone-move-request', this._onMove);
    },

    remove() {
      window.removeEventListener('drone-move-request', this._onMove);
    },

    _onMove(e) {
      const { id, x, y, z } = e.detail || {};
      if (!id) return;

      const sceneEl = this.el.sceneEl || this.el; // scene에 붙여도 되고 entity에 붙여도 됨
      const target = sceneEl.querySelector(`[data-drone-id="${CSS.escape(id)}"]`);
      if (!target) {
        console.warn('[drone-move-bridge] target not found:', id);
        return;
      }

      // A-Frame attribute로 이동 (권장)
      target.setAttribute('position', `${x} ${y} ${z}`);

      // 선택적으로: 패널 값 갱신용 이벤트
      window.dispatchEvent(
        new CustomEvent('drone-moved', { detail: { id, x, y, z } })
      );
    },
  });
}
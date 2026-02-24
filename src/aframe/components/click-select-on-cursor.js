import AFrame from '@skybrush/aframe-components';

let selectedEl = null;

if (!AFrame.components['click-select-on-cursor']) {
  AFrame.registerComponent('click-select-on-cursor', {
    init() {
      this._onClick = this._onClick.bind(this);
      // ✅ mouse-ray 엔티티에서 발생하는 click을 받는다
      this.el.addEventListener('click', this._onClick);
    },

    remove() {
      this.el.removeEventListener('click', this._onClick);
    },

    _findEntityFromObject3D(obj) {
      let cur = obj;
      while (cur) {
        if (cur.el) return cur.el;
        cur = cur.parent;
      }
      return null;
    },

    _onClick(e) {
      const hit = e.detail?.intersection;
      const hitEl = hit ? this._findEntityFromObject3D(hit.object) : null;

      // ✅ 빈 곳 클릭 → 선택 해제
      if (!hitEl) {
        if (selectedEl) {
          selectedEl.components?.['fbx-model']?._deselect?.();
          selectedEl = null;
        }
        return;
      }

      // ✅ 다른 드론 선택돼있으면 해제
      if (selectedEl && selectedEl !== hitEl) {
        selectedEl.components?.['fbx-model']?._deselect?.();
      }

      selectedEl = hitEl;

      // ✅ 드론 토글(너 fbx-model onClick이 토글이니까 click emit)
      hitEl.emit('click', { intersection: hit }, false);
    },
  });
}
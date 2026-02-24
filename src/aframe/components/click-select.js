import AFrame from '@skybrush/aframe-components';

let selectedEl = null;

if (!AFrame.components['click-select']) {
  AFrame.registerComponent('click-select', {
    init() {
      this._onPointerDown = this._onPointerDown.bind(this);
      this.el.sceneEl.addEventListener('pointerdown', this._onPointerDown, true);
    },

    remove() {
      this.el.sceneEl.removeEventListener('pointerdown', this._onPointerDown, true);
    },

    _findElFromObject3D(obj) {
      let cur = obj;
      while (cur) {
        if (cur.el) return cur.el;   // three object → a-frame entity
        cur = cur.parent;
      }
      return null;
    },

    _onPointerDown(e) {
      const rc = this.el.components.raycaster;
      if (!rc) return;

      // ✅ 클릭 순간 교차를 "강제로" 최신화 (버전에 따라 존재할 수도/없을 수도)
      rc.refreshObjects?.();
      rc.checkIntersections?.();

      const hit = (rc.intersections || [])[0];

      // 빈 곳 클릭 → 해제
      if (!hit) {
        if (selectedEl) {
          selectedEl.components?.['fbx-model']?._deselect?.();
          selectedEl = null;
        }
        return;
      }

      const hitEl = this._findElFromObject3D(hit.object);
      if (!hitEl) return;

      // 다른 거 선택돼 있으면 해제
      if (selectedEl && selectedEl !== hitEl) {
        selectedEl.components?.['fbx-model']?._deselect?.();
      }

      selectedEl = hitEl;

      // ✅ 드론 선택 토글 실행 (fbx-model의 onClick을 호출하거나, _select/_deselect 직접 호출)
      // 1) 토글 방식 (너 fbx-model onClick이 토글이면 이게 편함)
      hitEl.emit('click', { intersection: hit }, false);

      e.stopPropagation?.();
    },
  });
}
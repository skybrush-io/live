import AFrame from '@skybrush/aframe-components';
import * as THREE from 'three';

let selectedEl = null;

if (!AFrame.components['click-pick']) {
  AFrame.registerComponent('click-pick', {
    init() {
      this._raycaster = new THREE.Raycaster();
      this._mouse = new THREE.Vector2();
      this._onPointerDown = this._onPointerDown.bind(this);

      const sceneEl = this.el.sceneEl;
      const bind = () =>
        sceneEl.canvas?.addEventListener('pointerdown', this._onPointerDown, true);

      if (sceneEl.hasLoaded) bind();
      else sceneEl.addEventListener('loaded', bind);
    },

    remove() {
      this.el.sceneEl?.canvas?.removeEventListener(
        'pointerdown',
        this._onPointerDown,
        true
      );
    },

    _collectClickableRoots() {
      const sceneEl = this.el.sceneEl;
      const els = sceneEl.querySelectorAll('.three-d-clickable');
      const roots = [];
      els.forEach((el) => el?.object3D && roots.push(el.object3D));
      return roots;
    },

    _findFbxEntityFromObject3D(obj) {
      // ✅ 핵심: 부모 타고 올라가면서 "fbx-model 컴포넌트가 있는 엔티티"를 찾는다
      let cur = obj;
      while (cur) {
        const el = cur.el;
        if (el?.components?.['fbx-model']) return el;
        cur = cur.parent;
      }
      return null;
    },

    _requestRender() {
      const sceneEl = this.el.sceneEl;
      if (!sceneEl) return;
      if (sceneEl.render) sceneEl.render();
      else if (sceneEl.renderer && sceneEl.camera) {
        sceneEl.renderer.render(sceneEl.object3D, sceneEl.camera);
      }
    },

    _emitSelected(hitEl) {
      window.dispatchEvent(
        new CustomEvent('drone-selected', {
          detail: {
            id: hitEl.getAttribute('data-drone-id'),
            name: hitEl.getAttribute('data-drone-name'),
            battery: hitEl.getAttribute('data-battery'),
            status: hitEl.getAttribute('data-status'),
          },
        })
      );
    },

    _emitDeselected() {
      window.dispatchEvent(new CustomEvent('drone-deselected'));
    },

    _onPointerDown(e) {
      const sceneEl = this.el.sceneEl;
      const canvas = sceneEl?.canvas;
      const camera = sceneEl?.camera;
      if (!canvas || !camera) return;

      // 캔버스 영역 클릭만 처리
      const rect = canvas.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        return;
      }

      // NDC 좌표
      this._mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this._mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      this._raycaster.setFromCamera(this._mouse, camera);

      const roots = this._collectClickableRoots();
      const hits = this._raycaster.intersectObjects(roots, true); // ✅ 오타 제거

      // ✅ 빈 곳 클릭 → 해제 + 이벤트
      if (!hits.length) {
        if (selectedEl?.components?.['fbx-model']?._deselect) {
          selectedEl.components['fbx-model']._deselect();
          selectedEl = null;
          this._emitDeselected();
          this._requestRender();
        }
        return;
      }

      const hit = hits[0];
      const hitEl = this._findFbxEntityFromObject3D(hit.object);

      if (!hitEl) {
        console.warn('[click-pick] hit but no fbx-model entity found', hit.object);
        return;
      }

      // ✅ 다른 선택 해제 (다른 드론 클릭)
      if (selectedEl && selectedEl !== hitEl) {
        selectedEl.components?.['fbx-model']?._deselect?.();
      }

      const comp = hitEl.components?.['fbx-model'];
      if (!comp) return;

      // ✅ 토글을 "먼저" 수행하고, 그 결과로 이벤트 발행
      if (comp._isSelected) {
        comp._deselect();
        selectedEl = null;
        this._emitDeselected();
      } else {
        comp._select();
        selectedEl = hitEl;
        this._emitSelected(hitEl);
      }

      this._requestRender();
      e.stopPropagation?.();
    },
  });
}
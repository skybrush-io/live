import AFrame from '@skybrush/aframe-components';
import * as THREE from 'three';

let selectedEl = null;

if (!AFrame.components['click-pick']) {
  AFrame.registerComponent('click-pick', {
    init() {
      this._raycaster = new THREE.Raycaster();
      this._mouse = new THREE.Vector2();
      this._onPointerDown = this._onPointerDown.bind(this);
      this._onExternalDeselect = () => {
        if (selectedEl) {
          selectedEl.components?.['fbx-model']?._deselect?.();
          selectedEl = null;
          this._requestRender();
        }
      };

      const sceneEl = this.el.sceneEl;
      const bind = () =>
        sceneEl.canvas?.addEventListener('pointerdown', this._onPointerDown, true);

      if (sceneEl.hasLoaded) bind();
      else sceneEl.addEventListener('loaded', bind);

      window.addEventListener('drone-deselected', this._onExternalDeselect);
    },

    remove() {
      window.removeEventListener('drone-deselected', this._onExternalDeselect);
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
      // 핵심: 부모 타고 올라가면서 "fbx-model 컴포넌트가 있는 엔티티"를 찾는다
      let cur = obj;
      while (cur) {
        const el = cur.el;
        if (el?.components?.['fbx-model']) return el;
        cur = cur.parent;
      }
      return null;
    },

    _findDroneEntityFromObject3D(obj) {
      // 추가된 드론처럼 fbx-model 초기화 타이밍이 늦어도 data-drone-id 기준으로 찾는다.
      let cur = obj;
      while (cur) {
        const el = cur.el;
        if (el?.hasAttribute?.('data-drone-id')) return el;
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

    _readPosition(el, attributeName = 'position') {
      if (!el) return null;
      const pos = el.getAttribute(attributeName);
      if (!pos) return null;

      if (typeof pos === 'object') {
        const x = Number(pos.x);
        const y = Number(pos.y);
        const z = Number(pos.z);
        if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
          return { x, y, z };
        }
        return null;
      }

      if (typeof pos === 'string') {
        const [sx, sy, sz] = pos.trim().split(/\s+/);
        const x = Number(sx);
        const y = Number(sy);
        const z = Number(sz);
        if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
          return { x, y, z };
        }
      }

      return null;
    },

    _emitSelected(hitEl) {
      const currentPosition = this._readPosition(hitEl, 'position');
      const initialPosition = this._readPosition(hitEl, 'data-initial-pos');
      window.dispatchEvent(
        new CustomEvent('drone-selected', {
          detail: {
            id: hitEl.getAttribute('data-drone-id'),
            name: hitEl.getAttribute('data-drone-name'),
            battery: hitEl.getAttribute('data-battery'),
            status: hitEl.getAttribute('data-status'),
            currentPosition,
            initialPosition,
          },
        })
      );
    },

    _emitDeselected() {
      window.dispatchEvent(new CustomEvent('drone-deselected'));
    },

    _onPointerDown(e) {
      if (window.__droneAxisGizmoDragging) {
        return;
      }

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
      const hits = this._raycaster.intersectObjects(roots, true); // 드론 hit

      // 기즈모 축 핸들 클릭은 드론보다 앞에서 맞았을 때만 선택 토글에서 제외한다.
      const gizmoHandles = [];
      sceneEl.object3D?.traverse((obj) => {
        if (obj?.userData?.gizmoHandle) gizmoHandles.push(obj);
      });
      if (gizmoHandles.length) {
        const gizmoHits = this._raycaster.intersectObjects(gizmoHandles, true);
        const nearestGizmo = gizmoHits[0];
        const nearestDrone = hits[0];
        const gizmoIsFront =
          nearestGizmo &&
          (!nearestDrone || Number(nearestGizmo.distance) <= Number(nearestDrone.distance) + 1e-6);
        if (gizmoIsFront) {
          e.stopPropagation?.();
          return;
        }
      }

      // 빈 곳 클릭 → 해제 + 이벤트
      if (!hits.length) {
        if (selectedEl) {
          selectedEl.components?.['fbx-model']?._deselect?.();
          selectedEl = null;
          this._emitDeselected();
          this._requestRender();
        }
        return;
      }

      const hit = hits[0];
      const hitEl = this._findFbxEntityFromObject3D(hit.object)
        || this._findDroneEntityFromObject3D(hit.object);

      if (!hitEl) {
        console.warn('[click-pick] hit but no fbx-model entity found', hit.object);
        return;
      }

      // 다른 선택 해제 (다른 드론 클릭)
      if (selectedEl && selectedEl !== hitEl) {
        selectedEl.components?.['fbx-model']?._deselect?.();
      }

      const comp = hitEl.components?.['fbx-model'];

      // fbx-model 유무와 상관없이 data-drone-id 기준으로 토글
      if (selectedEl === hitEl) {
        comp?._deselect?.();
        selectedEl = null;
        this._emitDeselected();
      } else {
        comp?._select?.();
        selectedEl = hitEl;
        this._emitSelected(hitEl);
      }

      this._requestRender();
      e.stopPropagation?.();
    },
  });
}
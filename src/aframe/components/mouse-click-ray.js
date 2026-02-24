// mouse-click-ray.js
// ✅ 클릭할 때만 "카메라 → 마우스 방향" 레이를 잠깐(예: 300ms) 보여주는 컴포넌트
// ✅ render-on-demand(카메라 움직일 때만 렌더) 환경에서도 보이도록 renderBurst 포함
// ✅ @skybrush/aframe-components 를 쓰는 프로젝트용

import AFrame from '@skybrush/aframe-components';
import * as THREE from 'three';

if (!AFrame.components['mouse-click-ray']) {
  AFrame.registerComponent('mouse-click-ray', {
    schema: {
      far: { type: 'number', default: 5000 },     // 교차점이 없을 때 그릴 최대 길이
      duration: { type: 'number', default: 300 }, // ms: 클릭 후 얼마나 보여줄지
      color: { type: 'color', default: '#ff0000' },
      burstFramesShow: { type: 'int', default: 12 }, // 표시 직후 강제 렌더 프레임 수
      burstFramesHide: { type: 'int', default: 6 },  // 숨김 직후 강제 렌더 프레임 수
    },

    init() {
      this._mouse = new THREE.Vector2(0, 0);
      this._raycaster = new THREE.Raycaster();

      // ✅ 디버그 라인(월드에 붙임)
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));

      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(this.data.color),
        transparent: true,
        opacity: 1,
      });

      this._line = new THREE.Line(geom, mat);
      this._line.frustumCulled = false;
      this._line.visible = false;

      // 월드(씬 루트)에 붙이기
      this.el.sceneEl.object3D.add(this._line);

      this._hideTimer = null;
      this._burstRaf = null;

      // 마우스 좌표 추적 (클릭 전에 최신 좌표 유지)
      this._onMouseMove = (event) => {
        const sceneEl = this.el.sceneEl;
        const canvas = sceneEl?.canvas;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        this._mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this._mouse.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      };

      // ✅ 클릭 순간 레이 표시
      this._onPointerDown = (event) => {
        const sceneEl = this.el.sceneEl;
        const camera = sceneEl?.camera;
        const renderer = sceneEl?.renderer;
        if (!camera || !renderer) return;

        // 클릭 순간 마우스 좌표도 즉시 갱신 (mousemove 누락 대비)
        const canvas = sceneEl?.canvas;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          this._mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          this._mouse.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
        }

        // 카메라+마우스로 레이 생성
        this._raycaster.setFromCamera(this._mouse, camera);

        const origin = this._raycaster.ray.origin;
        const dir = this._raycaster.ray.direction;

        // 기본 end는 far까지
        let end = origin.clone().add(dir.clone().multiplyScalar(this.data.far));

        // ✅ 만약 현재 el(mouse-ray)의 raycaster가 교차점을 갖고 있으면 거기까지 그리기
        // (ThreeDView에서 mouse-ray 엔티티에 raycaster가 붙어있어야 함)
        const rc = this.el.components.raycaster;
        const hit = rc?.intersections?.[0];
        if (hit?.point) {
          end = hit.point.clone();
        }

        // 라인 업데이트
        const attr = this._line.geometry.attributes.position;
        attr.setXYZ(0, origin.x, origin.y, origin.z);
        attr.setXYZ(1, end.x, end.y, end.z);
        attr.needsUpdate = true;

        // 보이게
        this._line.visible = true;

        // ✅ render-on-demand 환경에서도 보이도록 클릭 직후 렌더 burst
        this._renderBurst(this.data.burstFramesShow);

        // duration 후 숨기기
        clearTimeout(this._hideTimer);
        this._hideTimer = setTimeout(() => {
          if (!this._line) return;
          this._line.visible = false;
          this._renderBurst(this.data.burstFramesHide);
        }, this.data.duration);
      };

      window.addEventListener('mousemove', this._onMouseMove, { passive: true });

      // 캡처로 받으면 UI 오버레이/버블링 이슈가 있어도 더 안정적
      this.el.sceneEl.addEventListener('pointerdown', this._onPointerDown, true);
    },

    // ✅ 렌더가 멈춰있는 환경(카메라 움직일 때만 렌더)에서 강제로 몇 프레임 렌더
    _renderBurst(frames = 10) {
      const sceneEl = this.el.sceneEl;
      const camera = sceneEl?.camera;
      const renderer = sceneEl?.renderer;
      if (!renderer || !camera) return;

      // 이전 burst 취소
      if (this._burstRaf) cancelAnimationFrame(this._burstRaf);

      let left = Math.max(1, frames);

      const step = () => {
        // A-Frame 스타일 render()가 있으면 그걸 우선 호출
        if (sceneEl.render) sceneEl.render();
        else renderer.render(sceneEl.object3D, camera);

        left -= 1;
        if (left > 0) this._burstRaf = requestAnimationFrame(step);
        else this._burstRaf = null;
      };

      this._burstRaf = requestAnimationFrame(step);
    },

    remove() {
      window.removeEventListener('mousemove', this._onMouseMove);
      this.el.sceneEl?.removeEventListener('pointerdown', this._onPointerDown, true);

      clearTimeout(this._hideTimer);
      if (this._burstRaf) cancelAnimationFrame(this._burstRaf);

      if (this._line) {
        this.el.sceneEl?.object3D?.remove(this._line);
        this._line.geometry.dispose();
        this._line.material.dispose();
        this._line = null;
      }
    },
  });
}
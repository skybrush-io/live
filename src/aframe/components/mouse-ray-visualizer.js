import AFrame from '@skybrush/aframe-components';
import * as THREE from 'three';

if (!AFrame.components['mouse-ray-visualizer']) {
  AFrame.registerComponent('mouse-ray-visualizer', {
    schema: {
      far: { type: 'number', default: 3 },     // 카메라 앞 3m 정도만 그리면 항상 잘 보임
      color: { type: 'color', default: '#ff0000' },
    },

    init() {
      this._mouse = new THREE.Vector2(0, 0);
      this._raycaster = new THREE.Raycaster();

      // ✅ 카메라 로컬 공간에서 그릴 라인 (원점=카메라)
      const geom = new THREE.BufferGeometry();
      const pos = new Float32Array([0, 0, 0, 0, 0, -this.data.far]);
      geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));

      const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(this.data.color) });

      this._line = new THREE.Line(geom, mat);
      this._line.frustumCulled = false;

      this._onMouseMove = (event) => {
        const canvas = this.el.sceneEl?.canvas;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        this._mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this._mouse.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

        // ✅ render-on-demand 깨우기(마우스 움직일 때마다 한 번)
        const sceneEl = this.el.sceneEl;
        if (sceneEl?.render) sceneEl.render();
      };

      window.addEventListener('mousemove', this._onMouseMove, { passive: true });

      this._attached = false;
    },

    tick() {
      const sceneEl = this.el.sceneEl;
      const camera = sceneEl?.camera;
      if (!camera || !this._line) return;

      // ✅ 카메라에 한 번만 붙인다 (항상 화면 기준으로 보이게)
      if (!this._attached) {
        camera.add(this._line);
        this._attached = true;
      }

      // ✅ 마우스 방향(월드) 레이 만들기
      this._raycaster.setFromCamera(this._mouse, camera);

      // 카메라 로컬 공간에서의 방향 벡터로 변환
      // world dir -> camera local dir
      const dirWorld = this._raycaster.ray.direction.clone().normalize();
      const dirLocal = dirWorld.clone().transformDirection(camera.matrixWorldInverse).normalize();

      // ✅ 카메라 로컬에서 end 점 계산
      const end = dirLocal.multiplyScalar(this.data.far);

      const attr = this._line.geometry.attributes.position;
      attr.setXYZ(0, 0, 0, 0);
      attr.setXYZ(1, end.x, end.y, end.z);
      attr.needsUpdate = true;

      // render-on-demand 환경에서 tick만으로는 안 그려질 수 있어 안전빵
      if (sceneEl?.renderer) sceneEl.renderer.render(sceneEl.object3D, camera);
    },

    remove() {
      window.removeEventListener('mousemove', this._onMouseMove);

      const camera = this.el.sceneEl?.camera;
      if (camera && this._line) camera.remove(this._line);

      if (this._line) {
        this._line.geometry.dispose();
        this._line.material.dispose();
        this._line = null;
      }
    },
  });
}
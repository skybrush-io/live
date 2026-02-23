import AFrame from '@skybrush/aframe-components';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

if (!AFrame.components['fbx-model']) {
  AFrame.registerComponent('fbx-model', {
    schema: {
      src: { type: 'asset', default: '' },
      scale: { type: 'vec3', default: { x: 1, y: 1, z: 1 } },
    },

    init() {
      this.model = null;
      this.loader = new FBXLoader();
      this._origColors = new Map();

      // ✅ mixin class가 안 먹어도 무조건 클릭 타겟이 되게 보장
      this.el.classList.add('three-d-clickable');

      this.onHit = this.onHit.bind(this);
      this.onUnhit = this.onUnhit.bind(this);

      // ✅ mouseenter보다 이게 훨씬 안정적
      this.el.addEventListener('raycaster-intersected', this.onHit);
      this.el.addEventListener('raycaster-intersected-cleared', this.onUnhit);
    },

    update() {
      const { src, scale } = this.data;
      if (!src) return;

      let finalUrl = src;
      if (src.startsWith('#')) {
        const assetId = src.slice(1);
        const assetItem = this.el.sceneEl.querySelector(`a-asset-item[id="${assetId}"]`);
        if (!assetItem) return;
        finalUrl = assetItem.getAttribute('src');
      }

      this.loader.load(finalUrl, (fbx) => {
        if (this.model) this.el.object3D.remove(this.model);

        fbx.scale.set(scale.x, scale.y, scale.z);
        this.model = fbx;
        this.el.object3D.add(fbx);
      });
    },

    _setMeshRed(mesh) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat, i) => {
        if (!mat || !mat.color) return;
        const key = `${mesh.uuid}:${i}`;
        if (!this._origColors.has(key)) this._origColors.set(key, mat.color.getHex());
        mat.color.setHex(0xff0000);
        mat.needsUpdate = true;
      });
    },

    _restoreMesh(mesh) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat, i) => {
        if (!mat || !mat.color) return;
        const key = `${mesh.uuid}:${i}`;
        if (!this._origColors.has(key)) return;
        mat.color.setHex(this._origColors.get(key));
        mat.needsUpdate = true;
      });
    },

    onHit() {
      console.log('HIT', this.el);
      if (!this.model) return;

      // ✅ Group 전체 traverse 해서 mesh에 적용
      this.model.traverse((child) => {
        if (child && child.isMesh) this._setMeshRed(child);
      });
    },

    onUnhit() {
      console.log('UNHIT', this.el);
      if (!this.model) return;

      this.model.traverse((child) => {
        if (child && child.isMesh) this._restoreMesh(child);
      });
    },

    remove() {
      this.el.removeEventListener('raycaster-intersected', this.onHit);
      this.el.removeEventListener('raycaster-intersected-cleared', this.onUnhit);
      this._origColors.clear();
    },
  });
}
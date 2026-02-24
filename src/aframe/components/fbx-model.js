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

      this._origMatColors = new Map();
      this._tintedMats = new Set();
      this._isSelected = false;

      this.el.classList.add('three-d-clickable');

      this.onClick = this.onClick.bind(this);
      this.el.addEventListener('click', this.onClick);
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
        if (this.model) {
          this._restoreAll();
          this.el.object3D.remove(this.model);
        }

        fbx.scale.set(scale.x, scale.y, scale.z);
        this.model = fbx;
        this.el.object3D.add(fbx);

        if (this._isSelected) this._applyRed();
      });
    },

    _applyRed() {
      if (!this.model) return;

      this.model.traverse((child) => {
        if (!child?.isMesh) return;

        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          if (!mat?.color) return;

          if (!this._origMatColors.has(mat)) {
            this._origMatColors.set(mat, mat.color.getHex());
          }

          mat.color.setHex(0xff0000);
          mat.needsUpdate = true;
          this._tintedMats.add(mat);
        });
      });
    },

    _restoreAll() {
      this._tintedMats.forEach((mat) => {
        const hex = this._origMatColors.get(mat);
        if (hex == null || !mat?.color) return;
        mat.color.setHex(hex);
        mat.needsUpdate = true;
      });
      this._tintedMats.clear();
    },

    _select() {
      console.log('Selected:', this.el);
      this._isSelected = true;
      this._applyRed();
    },

    _deselect() {
      this._isSelected = false;
      this._restoreAll();
    },

    onClick(e) {
      e.stopPropagation?.();

      if (this._isSelected) {
        this._deselect();
      } else {
        this._select();
      }
    },

    remove() {
      this.el.removeEventListener('click', this.onClick);
      this._restoreAll();
      this._origMatColors.clear();
      this._tintedMats.clear();
    },
  });
}
/**
 * A-Frame component that loads and displays an FBX model.
 * Uses Three.js FBXLoader to load FBX files.
 */

import AFrame from '@skybrush/aframe-components';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

AFrame.registerComponent('fbx-model', {
  schema: {
    src: { type: 'asset', default: '' },
    scale: { type: 'vec3', default: { x: 1, y: 1, z: 1 } },
  },

  init() {
    this.model = null;
    this.loader = new FBXLoader();
  },

  update() {
    const { src, scale } = this.data;

    if (!src) {
      return;
    }

    // Get the actual URL from A-Frame asset system if it's an asset ID
    let finalUrl = src;
    if (src.startsWith('#')) {
      const assetId = src.replace('#', '');
      const assetItem = this.el.sceneEl.querySelector(`a-asset-item[id="${assetId}"]`);
      if (assetItem) {
        finalUrl = assetItem.getAttribute('src');
      } else {
        console.warn(`FBX asset item with id "${assetId}" not found`);
        return;
      }
    }

    // Load the FBX model
    this.loader.load(
      finalUrl,
      (fbx) => {
        // Remove old model if exists
        if (this.model) {
          this.el.object3D.remove(this.model);
        }

        // Apply scale
        fbx.scale.set(scale.x, scale.y, scale.z);

        // Add to entity's object3D directly (avoid setObject3D so we don't
        // hit A-Frame's instanceof THREE.Object3D check — FBXLoader uses
        // a different THREE instance than A-Frame)
        this.model = fbx;
        this.el.object3D.add(fbx);
        this.el.emit('model-loaded', { format: 'fbx', model: fbx });
      },
      (progress) => {
        this.el.emit('model-loading', { progress });
      },
      (error) => {
        console.error('Error loading FBX model:', error);
        this.el.emit('model-error', { error });
      }
    );
  },

  remove() {
    if (this.model) {
      this.el.object3D.remove(this.model);
      this.model = null;
    }
  },
});

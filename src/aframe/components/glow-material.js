import AFrame from '@skybrush/aframe-components';

import GlowingMaterial from '../materials/GlowingMaterial';

AFrame.registerComponent('glow-material', {
  schema: {
    color: { type: 'color', is: 'uniform', default: '#0080ff' },
    falloff: { type: 'number', is: 'uniform', default: 0.1 },
    internalRadius: { type: 'number', is: 'uniform', default: 6 },
    sharpness: { type: 'number', is: 'uniform', default: 1 },
    opacity: { type: 'number', is: 'uniform', default: 1 },
  },

  init() {
    this.material = new GlowingMaterial(this._getMaterialProperties());
    this.el.addEventListener('loaded', () => {
      console.log('Loaded');
      const mesh = this.el.getObject3D('mesh');
      if (mesh) {
        mesh.material = this.material;
      }
    });
  },

  update() {
    this.material?.setValues(this._getMaterialProperties());
  },

  _getMaterialProperties() {
    const { color, falloff, internalRadius, sharpness, opacity } = this.data;
    return {
      color,
      falloff,
      internalRadius,
      sharpness,
      opacity,
    };
  },
});

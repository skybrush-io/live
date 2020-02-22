/**
 * A-Frame sprite component that shows a bitmap that always faces the camera.
 *
 * Used to implement a simple glow effect on spheres.
 */

import AFrame from '../aframe';

const {
  AdditiveBlending,
  NormalBlending,
  Sprite,
  SpriteMaterial
} = AFrame.THREE;

AFrame.registerComponent('sprite', {
  schema: {
    blending: {
      type: 'string',
      default: 'normal'
    },
    color: {
      type: 'color',
      default: '#ffffff'
    },
    src: {
      type: 'map'
    },
    scale: {
      type: 'vec3',
      default: { x: 1, y: 1, z: 1 }
    },
    transparent: {
      type: 'boolean',
      default: true
    }
  },

  init() {
    this.map = null;
    this.material = new SpriteMaterial({});
    this.sprite = new Sprite(this.material);
  },

  update(oldData) {
    const el = this.el;

    if (this.data.src !== oldData.src) {
      const savedSrc = this.data.src;
      el.sceneEl.systems.material.loadTexture(
        savedSrc,
        { src: savedSrc },
        texture => {
          // Check whether the 'src' property has been changed while loading
          // the image
          if (this.data.src === savedSrc) {
            // Update the texture
            this.material.map = texture;
            this.material.needsUpdate = true;
          }
        }
      );
    }

    if (this.data.blending !== oldData.blending) {
      switch (this.data.blending) {
        case 'additive':
          this.material.blending = AdditiveBlending;
          break;

        case 'normal':
          this.material.blending = NormalBlending;
          break;

        default:
          console.warn('Unknown blending type:', this.data.blending);
      }

      this.material.needsUpdate = true;
    }

    if (this.data.color !== oldData.color) {
      this.material.color.set(this.data.color);
      this.material.needsUpdate = true;
    }

    if (this.data.transparent !== oldData.transparent) {
      this.material.transparent = this.data.transparent;
      this.material.needsUpdate = true;
    }

    let mesh = el.getObject3D('mesh');
    if (mesh) {
      mesh.scale.copy(this.data.scale);
    } else {
      mesh = new Sprite(this.material);
      mesh.scale.copy(this.data.scale);
      el.setObject3D('mesh', mesh);
    }
  },

  remove() {
    this.el.removeObject3D('mesh');
  }
});

AFrame.registerPrimitive('a-sprite', {
  defaultComponents: {
    sprite: {}
  },
  mappings: {
    src: 'sprite.src',
    resize: 'sprite.scale'
  }
});

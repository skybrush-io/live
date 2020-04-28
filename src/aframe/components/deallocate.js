/**
 * Helper A-Frame component that deallocates the WebGL context when the
 * scene is unmounted.
 *
 * Source: https://github.com/ngokevin/aframe-react/issues/110
 */

import AFrame from '../aframe';

import { notifySceneRemoval } from '~/features/three-d/slice';
import store from '~/store';

const { Cache } = AFrame.THREE;

AFrame.registerComponent('deallocate', {
  remove() {
    store.dispatch(notifySceneRemoval());
    Cache.clear();
    this.el.renderer.forceContextLoss();
  },
});

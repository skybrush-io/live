/**
 * Helper A-Frame component that periodically synchronizes the pose of an
 * object with the Redux store.
 */

import AFrame from '../aframe';

import { getCameraPose } from '~/features/three-d/selectors';
import { setCameraPose } from '~/features/three-d/slice';
import store from '~/store';

AFrame.registerComponent('sync-pose-with-store', {
  schema: {
    interval: { type: 'number', default: 1000 },
  },

  init() {
    this._intervalHandle = undefined;
    this._synchronize = this._synchronize.bind(this);

    // Get the pose from the store and update the object if needed
    const { position, rotation } = getCameraPose(store.getState());
    if (position && Array.isArray(position)) {
      this.el.object3D.position.fromArray(position);
    }

    if (rotation && Array.isArray(rotation)) {
      this.el.object3D.rotation.fromArray(rotation);

      // Make sure that we play along nicely with look-controls
      if (this.el.components['look-controls']) {
        const { pitchObject, yawObject } = this.el.components['look-controls'];
        pitchObject.rotation.x = this.el.object3D.rotation.x;
        yawObject.rotation.y = this.el.object3D.rotation.y;
      }
    }

    // Make a snapshot of the current pose
    this._lastPosition = this.el.object3D.position.clone();
    this._lastRotation = this.el.object3D.rotation.clone();
  },

  update(oldData) {
    if (
      this._intervalHandle === undefined ||
      oldData.interval !== this.data.interval
    ) {
      this._setupIntervalCallback();
    }
  },

  remove() {
    if (this._intervalHandle) {
      clearInterval(this._intervalHandle);
      this._intervalHandle = undefined;
    }
  },

  _synchronize() {
    const { position, rotation } = this.el.object3D;

    if (
      !this._lastPosition.equals(position) ||
      !this._lastRotation.equals(rotation)
    ) {
      this._lastPosition.copy(position);
      this._lastRotation.copy(rotation);

      // Propagate the new pose to the store
      store.dispatch(
        setCameraPose({
          position: position.toArray(),
          rotation: rotation.toArray(),
        })
      );
    }
  },

  /**
   * Schedules a call to `_synchronize()` at regular intervals, depending on the
   * current value of `this.data.interval`.
   */
  _setupIntervalCallback() {
    if (this._intervalHandle) {
      clearInterval(this._intervalHandle);
      this._intervalHandle = undefined;
    }

    if (this.data.interval && this.data.interval > 0) {
      this._intervalHandle = setInterval(this._synchronize, this.data.interval);
    }
  },
});

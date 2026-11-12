/**
 * Patch for the `environment` component from `aframe-environment-component`.
 *
 * When the 3D view is re-parented in the workbench, A-Frame calls `remove()`
 * on the component but keeps it, and does not call `init()` again when the
 * entity is re-attached. The forced re-mounting of the scene in response to
 * `notifySceneRemoval()` calls `remove()` a second time. The original
 * implementation does not expect this and throws a `NotFoundError` when it
 * tries to remove child entities that are already gone.
 */

import AFrame from '@skybrush/aframe-components';

const { Component } = AFrame.components.environment;
const { remove } = Component.prototype;

Component.prototype.remove = function () {
  // The child entities were already removed if the hemisphere light is not
  // attached to our entity any more.
  if (this.hemilight?.parentNode === this.el) {
    remove.call(this);
  }
};

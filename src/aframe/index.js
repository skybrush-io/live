import AFrame from '@skybrush/aframe-components';
import * as THREE from 'three';

const patchThreeSafety = (threeLib) => {
  if (!threeLib?.Vector3?.prototype) return;

  if (!threeLib.Vector3.prototype.__safeSetFromMatrixPositionPatched) {
    const originalSetFromMatrixPosition = threeLib.Vector3.prototype.setFromMatrixPosition;
    threeLib.Vector3.prototype.setFromMatrixPosition = function setFromMatrixPositionSafe(matrix) {
      if (!matrix || !matrix.elements) {
        return this.set(0, 0, 0);
      }
      return originalSetFromMatrixPosition.call(this, matrix);
    };
    threeLib.Vector3.prototype.__safeSetFromMatrixPositionPatched = true;
  }

  if (!threeLib.Object3D?.prototype) return;

  if (!threeLib.Object3D.prototype.__safeGetWorldPositionPatched) {
    const originalGetWorldPosition = threeLib.Object3D.prototype.getWorldPosition;
    threeLib.Object3D.prototype.getWorldPosition = function getWorldPositionSafe(target) {
      const out = target || new threeLib.Vector3();
      return originalGetWorldPosition.call(this, out);
    };
    threeLib.Object3D.prototype.__safeGetWorldPositionPatched = true;
  }

  if (!threeLib.Object3D.prototype.__safeGetWorldQuaternionPatched) {
    const originalGetWorldQuaternion = threeLib.Object3D.prototype.getWorldQuaternion;
    threeLib.Object3D.prototype.getWorldQuaternion = function getWorldQuaternionSafe(target) {
      const out = target || new threeLib.Quaternion();
      return originalGetWorldQuaternion.call(this, out);
    };
    threeLib.Object3D.prototype.__safeGetWorldQuaternionPatched = true;
  }
};

const isRemovableChildRaceError = (error) =>
  !!error &&
  error.name === 'NotFoundError' &&
  typeof error.message === 'string' &&
  error.message.includes("Failed to execute 'removeChild' on 'Node'");

const patchRemoveChildSafety = () => {
  if (typeof Node === 'undefined' || !Node.prototype) return;
  if (Node.prototype.__safeRemoveChildPatched) return;

  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function removeChildSafe(child) {
    if (child && child.parentNode !== this) {
      return child;
    }

    try {
      return originalRemoveChild.call(this, child);
    } catch (error) {
      if (isRemovableChildRaceError(error)) {
        return child;
      }
      throw error;
    }
  };
  Node.prototype.__safeRemoveChildPatched = true;
};

const wrapRemoveSafely = (componentName, definition) => {
  if (!definition || typeof definition.remove !== 'function') return definition;
  if (definition.remove.__safeRemovePatched) return definition;

  const originalRemove = definition.remove;
  const wrappedRemove = function safeRemove(...args) {
    try {
      return originalRemove.apply(this, args);
    } catch (error) {
      if (!isRemovableChildRaceError(error)) {
        throw error;
      }
      // Some third-party A-Frame components remove DOM nodes that may already
      // be detached during React unmount/HMR races. Ignore that specific case.
      // eslint-disable-next-line no-console
      console.warn(
        `[aframe] Ignored removeChild race in component "${componentName}"`,
        error
      );
      return undefined;
    }
  };

  wrappedRemove.__safeRemovePatched = true;
  definition.remove = wrappedRemove;
  return definition;
};

const patchAFrameComponentRemoveSafety = (aframe) => {
  if (!aframe || aframe.__safeRemovePatchApplied) return;

  const originalRegisterComponent = aframe.registerComponent?.bind(aframe);
  if (typeof originalRegisterComponent === 'function') {
    aframe.registerComponent = (name, definition) =>
      originalRegisterComponent(name, wrapRemoveSafely(name, definition));
  }

  if (aframe.components && typeof aframe.components === 'object') {
    Object.entries(aframe.components).forEach(([name, component]) => {
      wrapRemoveSafely(name, component);
    });
  }

  aframe.__safeRemovePatchApplied = true;
};

const wrapMethodSafely = (holder, methodName) => {
  const original = holder?.[methodName];
  if (typeof original !== 'function' || original.__safeRemovePatched) return;

  const wrapped = function wrappedSafeMethod(...args) {
    try {
      return original.apply(this, args);
    } catch (error) {
      if (!isRemovableChildRaceError(error)) {
        throw error;
      }
      return undefined;
    }
  };

  wrapped.__safeRemovePatched = true;
  holder[methodName] = wrapped;
};

const patchAdvancedCameraControlsSafety = (aframe) => {
  const component = aframe?.components?.['advanced-camera-controls'];
  if (!component) return;

  // Definition-level methods
  wrapMethodSafely(component, 'remove');
  wrapMethodSafely(component, '_removeMouseEventListeners');
  wrapMethodSafely(component, '_removeKeyEventListeners');
  wrapMethodSafely(component, '_removeVisibilityEventListeners');

  // Runtime instance methods (AFRAME stores these on the Component prototype)
  const proto = component.Component?.prototype;
  if (proto) {
    wrapMethodSafely(proto, 'remove');
    wrapMethodSafely(proto, '_removeMouseEventListeners');
    wrapMethodSafely(proto, '_removeKeyEventListeners');
    wrapMethodSafely(proto, '_removeVisibilityEventListeners');
  }
};

patchThreeSafety(THREE);
patchThreeSafety(AFrame?.THREE);
patchRemoveChildSafety();
patchAFrameComponentRemoveSafety(AFrame);

import '@skybrush/aframe-components/advanced-camera-controls';
import '@skybrush/aframe-components/meshline';

import 'aframe-environment-component';

import './components/deallocate';
import './components/drone-flock';
import './components/fbx-model';
import './components/glow-material';
import './components/sync-pose-with-store';
import './components/click-select';
import './components/mouse-ray-visualizer';
import './components/mouse-click-ray';
import './components/mouse-click-ray-2d';
import './components/click-pick';
import './components/hover-cursor';
import './components/drone-axis-gizmo';
import './primitives/drone-flock';
import './components/drone-move-bridge';
import './components/click-select-on-cursor';
patchAdvancedCameraControlsSafety(AFrame);

// eslint-disable-next-line unicorn/prefer-export-from
export default AFrame;

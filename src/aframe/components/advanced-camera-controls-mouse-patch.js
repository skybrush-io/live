/**
 * Patches advanced-camera-controls so camera translation uses mouse drag
 * instead of keyboard (WASD / arrows / E / C).
 *
 * - Right button drag: move forward/back and strafe
 * - Middle button drag: change altitude
 * - Left button drag: look around (unchanged)
 * - Wheel: zoom (unchanged)
 */

import * as THREE from 'three';

const HALF_PI = Math.PI / 2;
const MOUSE_MOVE_SENSITIVITY = 0.02;
const MOUSE_ALTITUDE_SENSITIVITY = 0.02;

const clampAltitude = (component, position) => {
  if (
    !Number.isNaN(component.data.minAltitude) &&
    position.y < component.data.minAltitude
  ) {
    position.y = component.data.minAltitude;
  }

  if (
    !Number.isNaN(component.data.maxAltitude) &&
    position.y > component.data.maxAltitude
  ) {
    position.y = component.data.maxAltitude;
  }
};

const patchAdvancedCameraControlsMouse = (aframe) => {
  const component = aframe?.components?.['advanced-camera-controls'];
  const proto = component?.Component?.prototype;
  if (!component || !proto || proto.__mouseMovementPatched) {
    return;
  }

  const originalInit = proto.init;
  const originalOnMouseDown = proto._onMouseDown;
  const originalOnMouseMove = proto._onMouseMove;
  const originalOnMouseUp = proto._onMouseUp;
  const originalAttachMouse = proto._attachMouseEventListeners;
  const originalRemoveMouse = proto._removeMouseEventListeners;
  const originalBindMethods = proto._bindMethods;

  proto.init = function initWithMouseTranslate(...args) {
    originalInit.apply(this, args);
    this.mouseTranslate = { active: false, lastX: null, lastY: null };
    this.mouseAltitude = { active: false, lastY: null };
  };

  proto._bindMethods = function bindMethodsPatched() {
    originalBindMethods.call(this);
    this._onContextMenu = this._onContextMenu.bind(this);
  };

  proto._attachKeyEventListeners = function attachKeyListenersPatched() {
    // Keyboard movement disabled; zoom still uses the mouse wheel.
  };

  proto._applyMouseTranslate = (function () {
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const rotationEuler = new THREE.Euler(0, 0, 0, 'YXZ');

    return function applyMouseTranslate(deltaX, deltaY, accelerated) {
      const sensitivity = MOUSE_MOVE_SENSITIVITY * (accelerated ? 5 : 1);
      const { position, rotation } = this.el.object3D;

      const xRotation = this.data.fly
        ? rotation.x
        : Math.abs(rotation.x) < HALF_PI
          ? 0
          : Math.PI;

      rotationEuler.set(xRotation, rotation.y, rotation.z);

      forward.set(0, 0, -1).applyEuler(rotationEuler);
      right.set(1, 0, 0).applyEuler(rotationEuler);

      if (!this.data.fly) {
        forward.y = 0;
        right.y = 0;
        if (forward.lengthSq() > 0) forward.normalize();
        if (right.lengthSq() > 0) right.normalize();
      }

      position.addScaledVector(right, -deltaX * sensitivity);
      position.addScaledVector(forward, -deltaY * sensitivity);
      clampAltitude(this, position);
    };
  })();

  proto._applyMouseAltitude = function applyMouseAltitude(deltaY, accelerated) {
    const sensitivity = MOUSE_ALTITUDE_SENSITIVITY * (accelerated ? 5 : 1);
    const { position } = this.el.object3D;
    position.y -= deltaY * sensitivity;
    clampAltitude(this, position);
  };

  proto._onContextMenu = function onContextMenu(event) {
    event.preventDefault();
  };

  proto._attachMouseEventListeners = function attachMouseListenersPatched() {
    originalAttachMouse.call(this);
    const canvasElement = this.el?.sceneEl?.canvas;
    if (canvasElement) {
      canvasElement.addEventListener('contextmenu', this._onContextMenu, false);
    }
  };

  proto._removeMouseEventListeners = function removeMouseListenersPatched() {
    const canvasElement = this.el?.sceneEl?.canvas;
    if (canvasElement) {
      canvasElement.removeEventListener('contextmenu', this._onContextMenu);
    }
    originalRemoveMouse.call(this);
  };

  proto._onMouseDown = function onMouseDownPatched(event) {
    if (this.data.enabled && event.button === 2) {
      this.mouseTranslate.active = true;
      this.mouseTranslate.lastX = event.screenX;
      this.mouseTranslate.lastY = event.screenY;
      if (this.transition.active) {
        this._finishTransition({ clearVelocity: true });
      }
      event.preventDefault();
      return;
    }

    if (this.data.enabled && event.button === 1) {
      this.mouseAltitude.active = true;
      this.mouseAltitude.lastY = event.screenY;
      if (this.transition.active) {
        this._finishTransition({ clearVelocity: true });
      }
      event.preventDefault();
      return;
    }

    originalOnMouseDown.call(this, event);
  };

  proto._onMouseMove = function onMouseMovePatched(event) {
    if (this.mouseTranslate?.active && this.data.enabled) {
      const deltaX = event.screenX - this.mouseTranslate.lastX;
      const deltaY = event.screenY - this.mouseTranslate.lastY;
      this.mouseTranslate.lastX = event.screenX;
      this.mouseTranslate.lastY = event.screenY;
      this._applyMouseTranslate(deltaX, deltaY, event.shiftKey);
      return;
    }

    if (this.mouseAltitude?.active && this.data.enabled) {
      const deltaY = event.screenY - this.mouseAltitude.lastY;
      this.mouseAltitude.lastY = event.screenY;
      this._applyMouseAltitude(deltaY, event.shiftKey);
      return;
    }

    originalOnMouseMove.call(this, event);
  };

  proto._onMouseUp = function onMouseUpPatched(event) {
    if (event?.button === 2 && this.mouseTranslate) {
      this.mouseTranslate.active = false;
      this.mouseTranslate.lastX = null;
      this.mouseTranslate.lastY = null;
    }

    if (event?.button === 1 && this.mouseAltitude) {
      this.mouseAltitude.active = false;
      this.mouseAltitude.lastY = null;
    }

    originalOnMouseUp.call(this);
  };

  proto.__mouseMovementPatched = true;
  component.__mouseMovementPatched = true;
};

export default patchAdvancedCameraControlsMouse;

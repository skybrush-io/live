import AFrame from '@skybrush/aframe-components';
import * as THREE from 'three';

const AXES = [
  { key: 'x', dir: new THREE.Vector3(1, 0, 0), color: 0xff4d4f },
  { key: 'y', dir: new THREE.Vector3(0, 1, 0), color: 0x40a9ff },
  { key: 'z', dir: new THREE.Vector3(0, 0, 1), color: 0x52c41a },
];

if (!THREE.Object3D.prototype.__safeWorldTargetPatched) {
  const originalGetWorldPosition = THREE.Object3D.prototype.getWorldPosition;
  const originalGetWorldQuaternion = THREE.Object3D.prototype.getWorldQuaternion;

  THREE.Object3D.prototype.getWorldPosition = function getWorldPositionSafe(target) {
    const out = target || new THREE.Vector3();
    return originalGetWorldPosition.call(this, out);
  };

  THREE.Object3D.prototype.getWorldQuaternion = function getWorldQuaternionSafe(target) {
    const out = target || new THREE.Quaternion();
    return originalGetWorldQuaternion.call(this, out);
  };

  THREE.Object3D.prototype.__safeWorldTargetPatched = true;
}

const getPointerOnCanvas = (event, rect) => ({
  x: event.clientX - rect.left,
  y: event.clientY - rect.top,
});

const readWorldPosition = (obj, out) => {
  if (!obj || !out || !obj.matrixWorld || !obj.matrixWorld.elements) return false;
  obj.updateMatrixWorld?.(true);
  const e = obj.matrixWorld.elements;
  out.set(e[12], e[13], e[14]);
  return Number.isFinite(out.x) && Number.isFinite(out.y) && Number.isFinite(out.z);
};

const readWorldQuaternion = (obj, out) => {
  if (!obj || !out || !obj.matrixWorld) return false;
  obj.updateMatrixWorld?.(true);
  out.setFromRotationMatrix(obj.matrixWorld);
  return Number.isFinite(out.x) && Number.isFinite(out.y) && Number.isFinite(out.z);
};

if (!AFrame.components['drone-axis-gizmo']) {
  AFrame.registerComponent('drone-axis-gizmo', {
    init() {
      this._raycaster = new THREE.Raycaster();
      this._mouseNdc = new THREE.Vector2();

      this._gizmo = new THREE.Group();
      this._gizmo.name = 'drone-axis-gizmo-root';
      this._gizmo.visible = false;
      this.el.object3D.add(this._gizmo);

      this._handles = [];
      this._axisVisuals = {};
      this._selectedId = null;
      this._selectedEl = null;
      this._isDragging = false;
      this._activeAxis = null;
      this._dragState = null;

      this._buildGizmoMeshes();

      this._onDroneSelected = this._onDroneSelected.bind(this);
      this._onDroneDeselected = this._onDroneDeselected.bind(this);
      this._onDroneDeleteRequest = this._onDroneDeleteRequest.bind(this);
      this._onPointerDown = this._onPointerDown.bind(this);
      this._onPointerMove = this._onPointerMove.bind(this);
      this._onPointerUp = this._onPointerUp.bind(this);

      window.addEventListener('drone-selected', this._onDroneSelected);
      window.addEventListener('drone-deselected', this._onDroneDeselected);
      window.addEventListener('drone-delete-request', this._onDroneDeleteRequest);

      const sceneEl = this.el.sceneEl || this.el;
      const bindPointer = () => {
        const canvas = sceneEl.canvas;
        if (!canvas) return;
        canvas.addEventListener('pointerdown', this._onPointerDown, true);
        window.addEventListener('pointermove', this._onPointerMove, true);
        window.addEventListener('pointerup', this._onPointerUp, true);
      };

      if (sceneEl.hasLoaded) bindPointer();
      else sceneEl.addEventListener('loaded', bindPointer);
    },

    remove() {
      window.removeEventListener('drone-selected', this._onDroneSelected);
      window.removeEventListener('drone-deselected', this._onDroneDeselected);
      window.removeEventListener('drone-delete-request', this._onDroneDeleteRequest);

      const sceneEl = this.el.sceneEl || this.el;
      sceneEl.canvas?.removeEventListener('pointerdown', this._onPointerDown, true);
      window.removeEventListener('pointermove', this._onPointerMove, true);
      window.removeEventListener('pointerup', this._onPointerUp, true);

      this._endDrag();

      if (this._gizmo?.parent) {
        this._gizmo.parent.remove(this._gizmo);
      }
    },

    tick() {
      if (!this._selectedEl || !this._selectedEl.object3D) return;
      const worldPos = new THREE.Vector3();
      const hasPos = readWorldPosition(this._selectedEl.object3D, worldPos);
      if (!hasPos) return;
      this._gizmo.position.copy(worldPos);
      this._gizmo.quaternion.identity();

      if (!this._isDragging) {
        this._updateScaleByDistance();
      }
    },

    _buildGizmoMeshes() {
      const axisLength = 0.8;
      const coneOffset = axisLength + 0.12;
      const shaftRadius = 0.015;
      const coneRadius = 0.045;
      const coneHeight = 0.14;

      AXES.forEach(({ key, dir, color }) => {
        const axisGroup = new THREE.Group();
        axisGroup.name = `axis-${key}`;

        const shaftGeom = new THREE.CylinderGeometry(shaftRadius, shaftRadius, axisLength, 10);
        const shaftMat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true });
        const shaft = new THREE.Mesh(shaftGeom, shaftMat);
        shaft.position.y = axisLength / 2;
        shaft.userData.gizmoHandle = true;
        shaft.userData.axis = key;

        const coneGeom = new THREE.ConeGeometry(coneRadius, coneHeight, 12);
        const coneMat = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true });
        const cone = new THREE.Mesh(coneGeom, coneMat);
        cone.position.y = coneOffset;
        cone.userData.gizmoHandle = true;
        cone.userData.axis = key;

        const pickGeom = new THREE.CylinderGeometry(0.13, 0.13, axisLength + coneHeight + 0.12, 8);
        const pickMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.08,
          side: THREE.DoubleSide,
          depthTest: false,
        });
        const pickMesh = new THREE.Mesh(pickGeom, pickMat);
        pickMesh.position.y = (axisLength + coneHeight + 0.12) / 2;
        pickMesh.userData.gizmoHandle = true;
        pickMesh.userData.axis = key;

        axisGroup.add(shaft);
        axisGroup.add(cone);
        axisGroup.add(pickMesh);

        const quat = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir.clone().normalize()
        );
        axisGroup.quaternion.copy(quat);

        this._gizmo.add(axisGroup);
        this._handles.push(shaft, cone, pickMesh);
        this._axisVisuals[key] = { shaft, cone, pickMesh, color };
      });

      this._gizmo.renderOrder = 999;
      this._gizmo.traverse((obj) => {
        if (obj.material) obj.material.depthTest = false;
      });
      this._refreshAxisStyles();
    },

    _updateScaleByDistance() {
      const sceneEl = this.el.sceneEl || this.el;
      const camera = sceneEl.camera;
      if (!camera) return;

      const camPos = new THREE.Vector3();
      const gizmoPos = new THREE.Vector3();
      const hasCamPos = readWorldPosition(camera, camPos);
      const hasGizmoPos = readWorldPosition(this._gizmo, gizmoPos);
      if (!hasCamPos || !hasGizmoPos) return;
      const dist = camPos.distanceTo(gizmoPos);
      const scale = Math.max(0.3, dist * 0.08);
      this._gizmo.scale.setScalar(scale);
    },

    _onDroneSelected(event) {
      const { id } = event.detail || {};
      if (!id) {
        this._hideGizmo();
        return;
      }

      const sceneEl = this.el.sceneEl || this.el;
      const target = sceneEl.querySelector(`[data-drone-id="${CSS.escape(id)}"]`);
      if (!target?.object3D) {
        this._hideGizmo();
        return;
      }

      this._selectedId = id;
      this._selectedEl = target;
      this._gizmo.visible = true;
      this._updateScaleByDistance();
    },

    _onDroneDeselected() {
      this._hideGizmo();
    },

    _onDroneDeleteRequest(event) {
      const { id } = event.detail || {};
      if (id && id === this._selectedId) {
        this._hideGizmo();
      }
    },

    _hideGizmo() {
      this._endDrag();
      this._selectedId = null;
      this._selectedEl = null;
      this._gizmo.visible = false;
      this._setActiveAxis(null);
    },

    _setMouseNdc(pointer, rect) {
      this._mouseNdc.x = (pointer.x / rect.width) * 2 - 1;
      this._mouseNdc.y = -((pointer.y / rect.height) * 2 - 1);
    },

    _pickHandle(event, rect) {
      const pointer = getPointerOnCanvas(event, rect);
      this._setMouseNdc(pointer, rect);
      const sceneEl = this.el.sceneEl || this.el;
      const camera = sceneEl.camera;
      if (!camera) return null;

      this._raycaster.setFromCamera(this._mouseNdc, camera);
      const hits = this._raycaster.intersectObjects(this._handles, true);
      if (!hits.length) return null;
      return hits[0].object;
    },

    _onPointerDown(event) {
      if (!this._gizmo.visible || !this._selectedEl?.object3D) return;
      const sceneEl = this.el.sceneEl || this.el;
      const canvas = sceneEl.canvas;
      if (!canvas || !sceneEl.camera) return;

      const rect = canvas.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      ) {
        return;
      }

      const handle = this._pickHandle(event, rect);
      if (!handle?.userData?.gizmoHandle) return;

      const axis = handle.userData.axis;
      const axisDirWorld = this._getAxisWorldDirection(axis);
      if (!axisDirWorld) return;

      const axisOrigin = new THREE.Vector3();
      const hasOrigin = readWorldPosition(this._selectedEl.object3D, axisOrigin);
      if (!hasOrigin) return;

      const startAxisParam = this._calcAxisParamFromPointer(
        event,
        rect,
        sceneEl.camera,
        axisOrigin,
        axisDirWorld
      );
      if (!Number.isFinite(startAxisParam)) return;

      const pos = this._selectedEl.getAttribute('position') || { x: 0, y: 0, z: 0 };
      const parentQuat = new THREE.Quaternion();
      const parent = this._selectedEl.object3D.parent;
      const hasParentQuat = parent ? readWorldQuaternion(parent, parentQuat) : false;
      if (!hasParentQuat) parentQuat.identity();
      const axisDirLocal = axisDirWorld.clone().applyQuaternion(parentQuat.clone().invert()).normalize();

      this._dragState = {
        axis,
        axisDirWorld,
        axisDirLocal,
        axisOrigin,
        startAxisParam,
        startPos: { x: Number(pos.x) || 0, y: Number(pos.y) || 0, z: Number(pos.z) || 0 },
      };
      this._isDragging = true;
      this._setActiveAxis(axis);
      this._emitDragState({ dragging: true, axis });

      window.__droneAxisGizmoDragging = true;
      event.stopPropagation?.();
      event.preventDefault?.();
    },

    _onPointerMove(event) {
      if (!this._isDragging || !this._dragState || !this._selectedId) return;
      const sceneEl = this.el.sceneEl || this.el;
      const canvas = sceneEl.canvas;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const nextAxisParam = this._calcAxisParamFromPointer(
        event,
        rect,
        sceneEl.camera,
        this._dragState.axisOrigin,
        this._dragState.axisDirWorld
      );
      if (!Number.isFinite(nextAxisParam)) return;

      const delta = nextAxisParam - this._dragState.startAxisParam;

      const next = {
        x: this._dragState.startPos.x + this._dragState.axisDirLocal.x * delta,
        y: this._dragState.startPos.y + this._dragState.axisDirLocal.y * delta,
        z: this._dragState.startPos.z + this._dragState.axisDirLocal.z * delta,
      };

      window.dispatchEvent(
        new CustomEvent('drone-move-request', {
          detail: {
            id: this._selectedId,
            x: next.x,
            y: next.y,
            z: next.z,
          },
        })
      );
      this._emitDragState({
        dragging: true,
        axis: this._dragState.axis,
        x: next.x,
        y: next.y,
        z: next.z,
      });

      event.stopPropagation?.();
      event.preventDefault?.();
    },

    _onPointerUp(event) {
      if (!this._isDragging) return;
      this._endDrag();
      event.stopPropagation?.();
      event.preventDefault?.();
    },

    _endDrag() {
      if (this._isDragging) {
        this._emitDragState({ dragging: false, axis: null });
      }
      this._isDragging = false;
      this._dragState = null;
      this._setActiveAxis(null);
      window.__droneAxisGizmoDragging = false;
    },

    _emitDragState(payload) {
      window.dispatchEvent(new CustomEvent('drone-gizmo-drag-state', { detail: payload }));
    },

    _setActiveAxis(axis) {
      this._activeAxis = axis || null;
      this._refreshAxisStyles();
    },

    _refreshAxisStyles() {
      Object.entries(this._axisVisuals).forEach(([axis, meshes]) => {
        const isActive = !!this._activeAxis && this._activeAxis === axis;
        const isDimmed = !!this._activeAxis && this._activeAxis !== axis;

        const shaftOpacity = isActive ? 1 : isDimmed ? 0.2 : 0.9;
        const coneOpacity = isActive ? 1 : isDimmed ? 0.2 : 0.95;
        const pickOpacity = isActive ? 0.25 : isDimmed ? 0.04 : 0.08;

        meshes.shaft.material.opacity = shaftOpacity;
        meshes.cone.material.opacity = coneOpacity;
        meshes.pickMesh.material.opacity = pickOpacity;
      });
    },

    _getAxisWorldDirection(axisKey) {
      const axis = AXES.find((a) => a.key === axisKey);
      if (!axis) return null;
      return axis.dir.clone();
    },

    _calcAxisParamFromPointer(event, rect, camera, axisOrigin, axisDir) {
      if (!camera) return Number.NaN;

      const pointer = getPointerOnCanvas(event, rect);
      this._setMouseNdc(pointer, rect);
      this._raycaster.setFromCamera(this._mouseNdc, camera);
      const ray = this._raycaster.ray;

      const segStart = axisOrigin.clone().addScaledVector(axisDir, -10000);
      const segEnd = axisOrigin.clone().addScaledVector(axisDir, 10000);
      const pointOnRay = new THREE.Vector3();
      const pointOnAxis = new THREE.Vector3();
      ray.distanceSqToSegment(segStart, segEnd, pointOnRay, pointOnAxis);

      return pointOnAxis.clone().sub(axisOrigin).dot(axisDir);
    },
  });
}

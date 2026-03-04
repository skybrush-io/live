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

patchThreeSafety(THREE);
patchThreeSafety(AFrame?.THREE);

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

// eslint-disable-next-line unicorn/prefer-export-from
export default AFrame;

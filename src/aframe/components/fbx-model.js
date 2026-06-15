import AFrame from '@skybrush/aframe-components';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import * as THREE from 'three';

/** UR-9 OBJ 바운딩 박스 (mm): X=폭, Y=길이, Z=높이 */
const UR9_MODEL_EXTENT_MM = { x: 525.074671, y: 373.200002, z: 523.599718 };

/** 목표 실물 치수 (m): 폭 500mm, 길이 350mm, 높이 500mm */
const UR9_TARGET_SIZE_M = { x: 0.5, y: 0.35, z: 0.5 };

const DRONE_MODEL_SCALE = {
  x: UR9_TARGET_SIZE_M.x / UR9_MODEL_EXTENT_MM.x,
  y: UR9_TARGET_SIZE_M.y / UR9_MODEL_EXTENT_MM.y,
  z: UR9_TARGET_SIZE_M.z / UR9_MODEL_EXTENT_MM.z,
};

/** UR-9 OBJ 정면: X=가로, Z=높이(기둥), Y=깊이(앞). 장면 Z-up과 동일 — pitch/roll 회전 불필요 */
const DRONE_MODEL_ROTATION = { x: 0, y: 0, z: 0 };

/**
 * Show / Skybrush View yaw: 0° = +X, CCW positive.
 * UR-9 OBJ default nose = +Y → offset 90°. Negate yaw so heading matches View
 * (without negation, ±yaw pairs face outward instead of inward).
 */
const DRONE_MODEL_YAW_OFFSET = 90;

const showYawToModelRotationZ = (showYaw) => {
  const parsed = Number(showYaw);
  return Number.isFinite(parsed) ? DRONE_MODEL_YAW_OFFSET - parsed : null;
};

const resolveAssetUrl = (el, src) => {
  if (!src) return '';
  if (!src.startsWith('#')) return src;

  const assetId = src.slice(1);
  const assetItem = el.sceneEl.querySelector(`a-asset-item[id="${assetId}"]`);
  return assetItem ? assetItem.getAttribute('src') : '';
};

const centerModelAtOrigin = (model) => {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.y -= center.y;
  model.position.z -= box.min.z;
};

const applyModelScale = (model, scale) => {
  model.scale.set(scale.x, scale.y, scale.z);
};

const prepareLoadedModel = (model, scale, rotation) => {
  model.position.set(0, 0, 0);
  model.rotation.set(0, 0, 0);
  model.scale.set(1, 1, 1);

  applyModelScale(model, scale);
  model.rotation.set(
    THREE.MathUtils.degToRad(rotation.x),
    THREE.MathUtils.degToRad(rotation.y),
    THREE.MathUtils.degToRad(rotation.z)
  );
  centerModelAtOrigin(model);

  model.traverse((child) => {
    if (!child?.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    mats.forEach((mat) => {
      if (!mat) return;
      mat.side = THREE.DoubleSide;
      mat.needsUpdate = true;
    });
  });
};

const getTransformKey = (url, scale, rotation) =>
  `${url}|${scale.x},${scale.y},${scale.z}|${rotation.x},${rotation.y},${rotation.z}`;

if (!AFrame.components['fbx-model']) {
  AFrame.registerComponent('fbx-model', {
    schema: {
      src: { type: 'asset', default: '' },
      scale: { type: 'vec3', default: DRONE_MODEL_SCALE },
      modelRotation: { type: 'vec3', default: DRONE_MODEL_ROTATION },

      lightColor: { default: '#ffffff' },
      lightIntensity: { default: 2.0 },
      lightDistance: { default: 30 },

      offsetForward: { default: 0.2 },
      offsetRight: { default: 0.03 },
      offsetUp: { default: 0.05 },

      glowRadius: { default: 0.02 },
      glowOpacity: { default: 0.5 },
    },

    init() {
      this.model = null;
      this.fbxLoader = new FBXLoader();
      this.objLoader = new OBJLoader();
      this.mtlLoader = new MTLLoader();

      this._origMatColors = new Map();
      this._tintedMats = new Set();
      this._isSelected = false;

      this._light = null;
      this._glow = null;

      this._tmpCenter = new THREE.Vector3();
      this._tmpForwardW = new THREE.Vector3();
      this._tmpRightW = new THREE.Vector3();
      this._tmpUpW = new THREE.Vector3();
      this._tmpPos = new THREE.Vector3();
      this._tmpQuat = new THREE.Quaternion();

      this.el.classList.add('three-d-clickable');
    },

    update() {
      const { modelRotation, scale, src } = this.data;
      if (!src) return;

      const finalUrl = resolveAssetUrl(this.el, src);
      if (!finalUrl) {
        if (src.startsWith('#')) {
          const assetId = src.slice(1);
          const assetItem = this.el.sceneEl?.querySelector(
            `a-asset-item[id="${assetId}"]`
          );
          if (assetItem && !assetItem._droneModelLoadBound) {
            assetItem._droneModelLoadBound = true;
            const retry = () => this.update();
            assetItem.addEventListener('loaded', retry);
            assetItem.addEventListener('error', () => {
              console.error('[fbx-model] asset failed to load:', assetId);
            });
          }
        }
        return;
      }

      const transformKey = getTransformKey(finalUrl, scale, modelRotation);

      if (this.model && this._transformKey === transformKey) {
        return;
      }

      if (this.model && this._loadedUrl === finalUrl) {
        prepareLoadedModel(this.model, scale, modelRotation);
        this._transformKey = transformKey;
        this._ensureLight();
        return;
      }

      if (this._loadingUrl === finalUrl) {
        return;
      }
      this._loadingUrl = finalUrl;

      const onLoaded = (model) => {
        this._loadingUrl = null;
        this._loadedUrl = finalUrl;

        if (this.model) {
          this._restoreColorsOnly();
          this._removeLight();
          this.el.object3D.remove(this.model);
        }

        prepareLoadedModel(model, scale, modelRotation);
        this.model = model;
        this.el.object3D.add(model);
        this._transformKey = transformKey;

        this._ensureLight();
        if (this._isSelected) this._applyRedColorsOnly();
      };

      const onError = (error) => {
        this._loadingUrl = null;
        console.error('[fbx-model] failed to load model:', finalUrl, error);
      };

      if (/\.obj$/i.test(finalUrl)) {
        const basePath = finalUrl.slice(0, finalUrl.lastIndexOf('/') + 1);
        const objFile = finalUrl.slice(finalUrl.lastIndexOf('/') + 1);
        const mtlFile = objFile.replace(/\.obj$/i, '.mtl');

        this.mtlLoader.setPath(basePath);
        this.mtlLoader.load(
          mtlFile,
          (materials) => {
            materials.preload();
            const loader = new OBJLoader();
            loader.setMaterials(materials);
            loader.load(finalUrl, onLoaded, undefined, onError);
          },
          undefined,
          () => {
            this.objLoader.load(finalUrl, onLoaded, undefined, onError);
          }
        );
        return;
      }

      this.fbxLoader.load(finalUrl, onLoaded, undefined, onError);
    },

    tick() {
      if (!this._light || !this._glow || !this.model) return;
      this._updateLightPose();
    },

    setHeadingYaw() {},

    _getModelCenter(out) {
      if (!this.model) return out.set(0, 0, 0);
      const box = new THREE.Box3().setFromObject(this.model);
      box.getCenter(out);
      return out;
    },

    _getAxesWorld() {
      this.el.object3D.getWorldDirection(this._tmpForwardW).normalize();
      this.el.object3D.getWorldQuaternion(this._tmpQuat);
      this._tmpRightW.set(1, 0, 0).applyQuaternion(this._tmpQuat).normalize();
      this._tmpUpW.set(0, 1, 0).applyQuaternion(this._tmpQuat).normalize();
    },

    _getLightPos(out) {
      const center = this._getModelCenter(this._tmpCenter);
      this._getAxesWorld();

      const modelWorldQuat = new THREE.Quaternion();
      this.model.getWorldQuaternion(modelWorldQuat);
      const inv = modelWorldQuat.clone().invert();

      const forwardL = this._tmpForwardW.clone().applyQuaternion(inv).normalize();
      const rightL = this._tmpRightW.clone().applyQuaternion(inv).normalize();
      const upL = this._tmpUpW.clone().applyQuaternion(inv).normalize();

      out
        .copy(center)
        .addScaledVector(forwardL, this.data.offsetForward)
        .addScaledVector(rightL, this.data.offsetRight)
        .addScaledVector(upL, this.data.offsetUp);

      return out;
    },

    _ensureLight() {
      if (!this.model) return;

      const { lightColor, lightIntensity, lightDistance, glowRadius, glowOpacity } =
        this.data;

      if (this._light || this._glow) {
        if (this._light) {
          this._light.color.set(lightColor);
          this._light.intensity = lightIntensity;
          this._light.distance = lightDistance;
        }
        if (this._glow?.material) {
          this._glow.material.color.set(lightColor);
          this._glow.material.opacity = glowOpacity;
        }
        this._updateLightPose();
        return;
      }

      this._light = new THREE.PointLight(lightColor, lightIntensity, lightDistance);

      const geo = new THREE.SphereGeometry(glowRadius, 16, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: lightColor,
        transparent: true,
        opacity: glowOpacity,
        depthWrite: false,
      });
      this._glow = new THREE.Mesh(geo, mat);

      this.model.add(this._light);
      this.model.add(this._glow);

      this._updateLightPose();
    },

    _updateLightPose() {
      const pos = this._getLightPos(this._tmpPos);
      this._light.position.copy(pos);
      this._glow.position.copy(pos);
    },

    _removeLight() {
      if (!this.model) {
        this._light = null;
        this._glow = null;
        return;
      }
      if (this._light) {
        this.model.remove(this._light);
        this._light = null;
      }
      if (this._glow) {
        this.model.remove(this._glow);
        this._glow.geometry?.dispose?.();
        this._glow.material?.dispose?.();
        this._glow = null;
      }
    },

    _applyRedColorsOnly() {
      if (!this.model) return;

      this.model.traverse((child) => {
        if (!child?.isMesh) return;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          if (!mat?.color) return;
          if (!this._origMatColors.has(mat)) {
            this._origMatColors.set(mat, mat.color.getHex());
          }
          mat.color.setHex(0xff0000);
          mat.needsUpdate = true;
          this._tintedMats.add(mat);
        });
      });
    },

    _restoreColorsOnly() {
      this._tintedMats.forEach((mat) => {
        const hex = this._origMatColors.get(mat);
        if (hex == null || !mat?.color) return;
        mat.color.setHex(hex);
        mat.needsUpdate = true;
      });
      this._tintedMats.clear();
    },

    _select() {
      this._isSelected = true;
      this._applyRedColorsOnly();
    },

    _deselect() {
      this._isSelected = false;
      this._restoreColorsOnly();
    },

    remove() {
      this._restoreColorsOnly();
      this._removeLight();
      this._origMatColors.clear();
      this._tintedMats.clear();
    },
  });
}

export {
  DRONE_MODEL_ROTATION,
  DRONE_MODEL_SCALE,
  DRONE_MODEL_YAW_OFFSET,
  showYawToModelRotationZ,
  UR9_TARGET_SIZE_M,
};

import AFrame from '@skybrush/aframe-components';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as THREE from 'three';

if (!AFrame.components['fbx-model']) {
  AFrame.registerComponent('fbx-model', {
    schema: {
      src: { type: 'asset', default: '' },
      scale: { type: 'vec3', default: { x: 1, y: 1, z: 1 } },

      // ✅ 라이트 세팅
      lightColor: { default: '#ffffff' },
      lightIntensity: { default: 2.0 },
      lightDistance: { default: 30 },

      // ✅ 드론 기준 오프셋(드론이 회전해도 같이 회전)
      // forward: 드론 전방(-Z), right: 드론 우측(+X), up: 드론 위(+Y)
      offsetForward: { default: 20 }, // 앞(+면 전방으로)
      offsetRight: { default: 3 },   // 오른쪽(+면 우측으로)
      offsetUp: { default: 0 },      // 위(+면 위로)

      // ✅ 글로우(발광 구체)
      glowRadius: { default: 20 }, // 빛이 닿는 범위(거리 아님)
      glowOpacity: { default: 0.5}, // ⚠️ 0~1 권장
    },

    init() {
      this.model = null;
      this.loader = new FBXLoader();

      this._origMatColors = new Map();
      this._tintedMats = new Set();
      this._isSelected = false;

      this._light = null;
      this._glow = null;

      // 캐시
      this._tmpCenter = new THREE.Vector3();
      this._tmpForwardW = new THREE.Vector3();
      this._tmpRightW = new THREE.Vector3();
      this._tmpUpW = new THREE.Vector3();
      this._tmpPos = new THREE.Vector3();
      this._tmpQuat = new THREE.Quaternion();

      this.el.classList.add('three-d-clickable');
    },

    update() {
      const { src, scale } = this.data;
      if (!src) return;

      let finalUrl = src;
      if (src.startsWith('#')) {
        const assetId = src.slice(1);
        const assetItem = this.el.sceneEl.querySelector(`a-asset-item[id="${assetId}"]`);
        if (!assetItem) return;
        finalUrl = assetItem.getAttribute('src');
      }

      this.loader.load(finalUrl, (fbx) => {
        if (this.model) {
          this._restoreColorsOnly();
          this._removeLight();
          this.el.object3D.remove(this.model);
        }

        fbx.scale.set(scale.x, scale.y, scale.z);
        this.model = fbx;
        this.el.object3D.add(fbx);

        this._ensureLight();
        if (this._isSelected) this._applyRedColorsOnly();
      });
    },

    tick() {
      if (!this._light || !this._glow || !this.model) return;
      this._updateLightPose();
    },

    // -------------------------
    // Light helpers
    // -------------------------

    _getModelCenter(out) {
      if (!this.model) return out.set(0, 0, 0);
      const box = new THREE.Box3().setFromObject(this.model);
      box.getCenter(out);
      return out;
    },

    _getAxesWorld() {
      // 드론 기준 축을 "월드 방향"으로 얻기
      // forward는 el.object3D.getWorldDirection()로 구하면 됨(= -Z)
      this.el.object3D.getWorldDirection(this._tmpForwardW).normalize();

      // right(+X), up(+Y)는 엔티티 월드쿼터니언 적용
      this.el.object3D.getWorldQuaternion(this._tmpQuat);

      this._tmpRightW.set(1, 0, 0).applyQuaternion(this._tmpQuat).normalize();
      this._tmpUpW.set(0, 1, 0).applyQuaternion(this._tmpQuat).normalize();
    },

    _getLightPos(out) {
      const center = this._getModelCenter(this._tmpCenter);

      // 1) 드론 축을 월드에서 구함
      this._getAxesWorld();

      // 2) light/glow는 model(local)에 붙어있으니
      //    world 방향 벡터들을 model local로 변환
      const modelWorldQuat = new THREE.Quaternion();
      this.model.getWorldQuaternion(modelWorldQuat);
      const inv = modelWorldQuat.clone().invert();

      const forwardL = this._tmpForwardW.clone().applyQuaternion(inv).normalize();
      const rightL = this._tmpRightW.clone().applyQuaternion(inv).normalize();
      const upL = this._tmpUpW.clone().applyQuaternion(inv).normalize();

      // 3) center + (forward/right/up) * offsets
      out.copy(center)
        .addScaledVector(forwardL, this.data.offsetForward)
        .addScaledVector(rightL, this.data.offsetRight)
        .addScaledVector(upL, this.data.offsetUp);

      return out;
    },

    _ensureLight() {
      if (!this.model) return;

      const { lightColor, lightIntensity, lightDistance, glowRadius, glowOpacity } = this.data;

      // 이미 있으면 업데이트만
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

      // ✅ PointLight
      this._light = new THREE.PointLight(lightColor, lightIntensity, lightDistance);

      // ✅ Glow sphere (보이는 발광점)
      const geo = new THREE.SphereGeometry(glowRadius, 16, 16);
      const mat = new THREE.MeshBasicMaterial({
        color: lightColor,
        transparent: true,
        opacity: glowOpacity, // 0~1
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

    // -------------------------
    // Selection color (optional)
    // -------------------------

    _applyRedColorsOnly() {
      if (!this.model) return;

      this.model.traverse((child) => {
        if (!child?.isMesh) return;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          if (!mat?.color) return;
          if (!this._origMatColors.has(mat)) this._origMatColors.set(mat, mat.color.getHex());
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
/**
 * A-Frame component that implements the logic needed to implement a
 * "drone flock" entity consisting of multiple drones backed by a `Flock`
 * instance.
 */

import { createSelector } from '@reduxjs/toolkit';
import { MiniSignal } from 'mini-signals';
import watch from 'redux-watch';

import AFrame from '@skybrush/aframe-components';

import { createSelectionHandlerThunk } from '~/components/helpers/lists';
import { setSelectedUAVIds } from '~/features/uavs/actions';
import { getSelectedUAVIds } from '~/features/uavs/selectors';
import { setFeatureIdForTooltip } from '~/features/session/slice';
import UAVErrorCode from '~/flockwave/UAVErrorCode';
import { getClockById } from '~/features/clocks/selectors';
import { CommonClockId } from '~/features/clocks/types';
import { getPreferredDroneRadius } from '~/features/three-d/selectors';
import flock from '~/flock';
import { abbreviateGPSFixType } from '~/model/enums';
import { uavIdToGlobalId } from '~/model/identifiers';
import { getFlatEarthCoordinateTransformer } from '~/selectors/map';
import store from '~/store';
import { showYawToModelRotationZ } from '~/aframe/components/fbx-model';
import { resolveShowYawForUav } from '~/views/three-d/showYawUtils';

const { THREE } = AFrame;
const DRONE_BODY_COLOR = 0xff8c00;
const DRONE_ARMED_COLOR = 0x00ff00;
const DRONE_HOVER_COLOR = 0xff0000;
const DRONE_SELECTION_BOX_COLOR = 0x58c7ff;

const getDroneBodyColorFromUAV = (uav) =>
  uav.errors.includes(UAVErrorCode.MOTORS_RUNNING_WHILE_ON_GROUND)
    ? DRONE_ARMED_COLOR
    : DRONE_BODY_COLOR;

const getDroneStatusTextFromUAV = (uav) => {
  if (uav.errors?.includes(UAVErrorCode.ON_GROUND)) return 'ground';
  if (uav.errors?.length > 0) return UAVErrorCode.abbreviate(Math.max(...uav.errors));
  if (uav.position && Math.abs(uav.position.ahl ?? 0) >= 0.3) {
    return `airborne ${(uav.position.ahl ?? 0).toFixed(2)}m`;
  }
  return uav.mode || uav.age || 'ready';
};

const getDroneBatteryTextFromUAV = (uav) => {
  const voltage = Number(uav.battery?.voltage);
  if (Number.isFinite(voltage) && voltage > 0) return `${voltage.toFixed(2)}V`;

  const percentage = Number(uav.battery?.percentage);
  if (Number.isFinite(percentage)) return `${Math.round(percentage)}%`;

  return '';
};

const formatOptionalNumber = (value, digits = 1) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(digits) : '';
};

const getDroneTelemetryFromUAV = (uav) => {
  const batteryVoltage = formatOptionalNumber(uav.battery?.voltage, 2);
  const batteryPercentage = formatOptionalNumber(uav.battery?.percentage, 0);
  const gpsFix = uav.gpsFix?.type === undefined
    ? ''
    : abbreviateGPSFixType(uav.gpsFix.type);
  const satellites = formatOptionalNumber(uav.gpsFix?.numSatellites, 0);
  const heading = formatOptionalNumber(uav.heading, 0);

  return {
    ahl: formatOptionalNumber(uav.position?.ahl, 1),
    agl: formatOptionalNumber(uav.position?.agl, 1),
    amsl: formatOptionalNumber(uav.position?.amsl, 1),
    battery: getDroneBatteryTextFromUAV(uav),
    batteryPercentage,
    batteryVoltage,
    gpsFix,
    heading,
    mode: uav.mode || '',
    satellites,
    status: getDroneStatusTextFromUAV(uav),
  };
};

/**
 * Selector that takes the Redux state and returns a function that can be called
 * with two arguments; the first argument must be an object having `lon`, `lat`
 * and `ahl` properties, while the second argument must be an existing
 * `THREE.Vector3` vector. This function will update the vector in-place to the
 * coordinates in the 3D view corresponding to the given GPS position.
 *
 * The returned function is designed in a way that it avoids allocating objects
 * to prevent the GC from being triggered too often while updating the
 * coordinates of the drones in the 3D view.
 */
const getUpdatePositionFromGPSCoordinatesFunction = createSelector(
  getFlatEarthCoordinateTransformer,
  (transformation) => (coordinate, result) => {
    if (coordinate !== null && coordinate !== undefined && transformation) {
      return transformation.updateVector3FromLonLatAhl(
        result,
        coordinate.lon,
        coordinate.lat,
        coordinate.ahl
      );
    }
  }
);

AFrame.registerSystem('drone-flock', {
  init() {
    this.droneRadiusChanged = new MiniSignal();

    this._onDroneRadiusChanged = this._onDroneRadiusChanged.bind(this);
    this._onSelectionChanged = this._onSelectionChanged.bind(this);

    this._selectionThunk = createSelectionHandlerThunk({
      getSelection: getSelectedUAVIds,
      setSelection: setSelectedUAVIds,
    });

    const updatePositionFromGPSCoordinatesFunctionGetter = () =>
      getUpdatePositionFromGPSCoordinatesFunction(store.getState());
    store.subscribe(
      watch(updatePositionFromGPSCoordinatesFunctionGetter)((newValue) => {
        this._updatePositionFromGPSCoordinates = newValue;
      })
    );
    this._updatePositionFromGPSCoordinates =
      updatePositionFromGPSCoordinatesFunctionGetter();

    const droneRadiusGetter = () => getPreferredDroneRadius(store.getState());
    store.subscribe(watch(droneRadiusGetter)(this._onDroneRadiusChanged));
    this._onDroneRadiusChanged(droneRadiusGetter());

    const selectionGetter = () => getSelectedUAVIds(store.getState());
    store.subscribe(watch(selectionGetter)(this._onSelectionChanged));

    this._updatePositionFromLocalCoordinates = (coordinate, result) => {
      if (coordinate !== null && coordinate !== undefined) {
        result.x = coordinate[0];
        result.y = coordinate[1];
        result.z = coordinate[2];
      }
    };
  },

  createNewUAVEntity() {
    const element = document.createElement('a-entity');
    element.setAttribute('position', '0 0 0');

    const visual = document.createElement('a-entity');
    visual.setAttribute('mixin', 'drone-marker');
    visual.classList.add('three-d-clickable');
    element.appendChild(visual);

    this.updateEntityGeometry(element);

    return element;
  },

  _applyEntityYaw(entity, yaw) {
    const parsed = Number(yaw);
    if (!Number.isFinite(parsed)) return;

    const modelZ = showYawToModelRotationZ(parsed);
    if (modelZ == null) return;

    entity.setAttribute('data-heading', String(parsed));
    // Match drone-move-bridge / DroneShapeMarkers: show yaw → model rotation on Z.
    entity.setAttribute('rotation', `0 0 ${modelZ}`);
    entity.object3D.rotation.set(0, 0, THREE.MathUtils.degToRad(modelZ));
  },

  _resolveEntityYaw(uav) {
    const state = store.getState();
    const showYaw = resolveShowYawForUav(state, uav.id);
    if (showYaw != null) return showYaw;

    const showClock = getClockById(state, CommonClockId.SHOW);
    if (showClock?.running) return null;

    const heading = Number(uav.heading);
    return Number.isFinite(heading) ? heading : null;
  },

  updateEntityFromUAV(entity, uav) {
    const telemetry = getDroneTelemetryFromUAV(uav);

    entity.setAttribute('data-drone-id', uav.id);
    entity.setAttribute('data-drone-name', uav.id);
    entity.setAttribute('data-drone-source', 'uav');
    entity.setAttribute('data-status', telemetry.status);
    entity.setAttribute('data-battery', telemetry.battery);
    entity.setAttribute('data-battery-percentage', telemetry.batteryPercentage);
    entity.setAttribute('data-battery-voltage', telemetry.batteryVoltage);
    entity.setAttribute('data-mode', telemetry.mode);
    entity.setAttribute('data-gps-fix', telemetry.gpsFix);
    entity.setAttribute('data-satellites', telemetry.satellites);
    entity.setAttribute('data-ahl', telemetry.ahl);
    entity.setAttribute('data-agl', telemetry.agl);
    entity.setAttribute('data-amsl', telemetry.amsl);
    entity.setAttribute('data-heading', telemetry.heading);

    const yaw = this._resolveEntityYaw(uav);
    if (yaw != null) {
      this._applyEntityYaw(entity, yaw);
    }

    if (uav.hasLocalPosition) {
      this._updatePositionFromLocalCoordinates(
        uav.localPosition,
        entity.object3D.position
      );
    } else if (this._updatePositionFromGPSCoordinates) {
      this._updatePositionFromGPSCoordinates(uav, entity.object3D.position);
    }
    entity.setAttribute('position', {
      x: entity.object3D.position.x,
      y: entity.object3D.position.y,
      z: entity.object3D.position.z,
    });

    const bodyColor = getDroneBodyColorFromUAV(uav);
    entity.originalColor = bodyColor;
    const mesh = entity.getObject3D('mesh');
    if (mesh?.material?.color) {
      mesh.material.color.setHex(bodyColor);
    }

    if (entity.isSelected) {
      window.dispatchEvent(
        new CustomEvent('drone-status-updated', {
          detail: {
            id: uav.id,
            name: uav.id,
            ...telemetry,
          },
        })
      );
    }
  },

  updateEntityGeometry(entity) {
    entity.removeAttribute('geometry');
    entity.removeAttribute('material');

    // Update selection box
    if (entity.selectionBox) {
      entity.object3D.remove(entity.selectionBox);
      entity.selectionBox.geometry.dispose();
      entity.selectionBox.material.dispose();
      entity.selectionBox = null;
    }

    const size = this._droneRadius * 2.8;
    const boxGeometry = new THREE.BoxGeometry(size, size, size);
    const edges = new THREE.EdgesGeometry(boxGeometry);
    boxGeometry.dispose();
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({
        color: DRONE_SELECTION_BOX_COLOR,
        depthTest: false,
        transparent: true,
        opacity: 0.95,
      })
    );
    line.userData.clickPickIgnore = true;
    line.visible = Boolean(entity.isHovered || entity.isSelected);
    entity.object3D.add(line);
    entity.selectionBox = line;

  },

  setEntityHovered(entity, hovered) {
    entity.isHovered = hovered;
    this.updateSelectionBoxVisibility(entity);
  },

  setEntitySelected(entity, selected) {
    entity.isSelected = selected;
    this.updateSelectionBoxVisibility(entity);
  },

  updateSelectionBoxVisibility(entity) {
    if (entity?.selectionBox) {
      entity.selectionBox.visible = Boolean(entity.isHovered || entity.isSelected);
    }
  },

  _onDroneRadiusChanged(newValue) {
    this._droneRadius = newValue;
    this._droneGeometry = {
      primitive: 'sphere',
      radius: this._droneRadius,
      segmentsHeight: 9,
      segmentsWidth: 18,
    };

    this.droneRadiusChanged.dispatch();
  },

  _onSelectionChanged(_newValue, _oldValue) {
    // TODO(ntamas): Schedule an update of the entity selection state in the next tick
  },
});

AFrame.registerComponent('drone-flock', {
  schema: {},

  init() {
    this.getEntityForUAVById = this.getEntityForUAVById.bind(this);

    this._onUAVsAdded = this._onUAVsAdded.bind(this);
    this._onUAVsRemoved = this._onUAVsRemoved.bind(this);
    this._onUAVsUpdated = this._onUAVsUpdated.bind(this);
    this._onUAVGeometryChanged = this._onUAVGeometryChanged.bind(this);
    this._onDroneSelected = this._onDroneSelected.bind(this);
    this._onDroneDeselected = this._onDroneDeselected.bind(this);
    this._onSelectionChanged = this._onSelectionChanged.bind(this);

    this._uavIdToEntity = {};
    this._selectedUAVIds = getSelectedUAVIds(store.getState());

    // mini-signals v2: detach()는 add()를 호출한 “그 MiniSignal 인스턴스”에서만 호출해야 한다.
    // Golden Layout 등으로 씬이 바뀌면 this.system이 새 시스템을 가리켜 심볼 불일치 오류가 난다.
    const droneRadiusChanged = this.system.droneRadiusChanged;
    this._droneRadiusChangedSignal = droneRadiusChanged;

    this._signals = {
      uavGeometryChanged: droneRadiusChanged.add(this._onUAVGeometryChanged),
      uavsAdded: flock.uavsAdded.add(this._onUAVsAdded),
      uavsRemoved: flock.uavsRemoved.add(this._onUAVsRemoved),
      uavsUpdated: flock.uavsUpdated.add(this._onUAVsUpdated),
    };
    const selectionGetter = () => getSelectedUAVIds(store.getState());
    this._unsubscribeSelection = store.subscribe(
      watch(selectionGetter)(this._onSelectionChanged)
    );

    this._pendingUAVsToAdd = flock.getAllUAVIds();
    window.addEventListener('drone-selected', this._onDroneSelected);
    window.addEventListener('drone-deselected', this._onDroneDeselected);
  },

  remove() {
    window.removeEventListener('drone-selected', this._onDroneSelected);
    window.removeEventListener('drone-deselected', this._onDroneDeselected);

    if (this._unsubscribeSelection) {
      this._unsubscribeSelection();
      this._unsubscribeSelection = null;
    }

    if (!this._signals) {
      return;
    }

    const s = this._signals;
    this._signals = null;

    flock.uavsAdded.detach(s.uavsAdded);
    flock.uavsRemoved.detach(s.uavsRemoved);
    flock.uavsUpdated.detach(s.uavsUpdated);
    if (this._droneRadiusChangedSignal) {
      this._droneRadiusChangedSignal.detach(s.uavGeometryChanged);
      this._droneRadiusChangedSignal = null;
    }
  },

  tick() {
    if (this._pendingUAVsToAdd) {
      for (const uavId of this._pendingUAVsToAdd) {
        const uav = flock.getUAVById(uavId);
        this._ensureUAVEntityExists(uav);
      }

      this._pendingUAVsToAdd = undefined;
    }

    const showClock = getClockById(store.getState(), CommonClockId.SHOW);
    if (!showClock?.running) return;

    for (const [uavId, entity] of Object.entries(this._uavIdToEntity)) {
      const yaw = resolveShowYawForUav(store.getState(), uavId);
      if (yaw != null) {
        this.system._applyEntityYaw(entity, yaw);
      }
    }
  },

  getEntityForUAVById(id) {
    return this._uavIdToEntity[id];
  },

  _ensureUAVEntityExists(uav) {
    const existingEntity = this._getEntityForUAV(uav);
    if (existingEntity) {
      return existingEntity;
    }

    const { id } = uav;

    if (id && id.length > 0) {
      const entity = this.system.createNewUAVEntity();

      if (entity) {
        this.el.append(entity);

        entity.className = 'three-d-clickable';
        entity.setAttribute('data-drone-id', id);
        entity.setAttribute('data-drone-name', id);
        entity.setAttribute('data-drone-source', 'uav');
        entity.addEventListener('mouseenter', () => {
          store.dispatch(setFeatureIdForTooltip(uavIdToGlobalId(id)));
          const mesh = entity.getObject3D('mesh');
          if (mesh) {
            entity.originalColor = entity.originalColor || mesh.material.color.getHex();
            mesh.material.color.setHex(DRONE_HOVER_COLOR);
          }
          this.system.setEntityHovered(entity, true);
        });
        entity.addEventListener('mouseleave', () => {
          store.dispatch(setFeatureIdForTooltip(null));
          const mesh = entity.getObject3D('mesh');
          if (mesh && entity.originalColor) {
            mesh.material.color.setHex(entity.originalColor);
          }
          this.system.setEntityHovered(entity, false);
        });
        entity.addEventListener('click', (event) => {
          // TODO(ntamas): the click event we receive from A-Frame does not
          // contain the information about whether the Ctrl/Cmd key is pressed.
          // We need to subscribe to keydown/keyup events on our own to record
          // this information and use it.
          store.dispatch(this.system._selectionThunk(id, event));
        });

        this._uavIdToEntity[id] = entity;
        return entity;
      }
    }
  },

  _ensureUAVEntityDoesNotExist(uav) {
    const existingEntity = this._getEntityForUAV(uav);
    if (existingEntity) {
      existingEntity.remove();
    }

    const { [uav.id]: _removed, ...remainingEntities } = this._uavIdToEntity;
    this._uavIdToEntity = remainingEntities;
  },

  _getEntityForUAV(uav) {
    return this._uavIdToEntity[uav ? uav.id : undefined];
  },

  _setSelectedUAVIds(ids) {
    this._selectedUAVIds = Array.isArray(ids) ? ids.map(String) : [];
    const selectedIds = new Set(this._selectedUAVIds);
    for (const [id, entity] of Object.entries(this._uavIdToEntity)) {
      this.system.setEntitySelected(entity, selectedIds.has(String(id)));
    }
  },

  _onDroneSelected(event) {
    const id = event.detail?.id;
    if (!id || !this._uavIdToEntity[id]) {
      const hadSelection = this._selectedUAVIds?.some(
        (selectedId) => this._uavIdToEntity[selectedId]
      );
      this._setSelectedUAVIds([]);
      if (hadSelection) {
        store.dispatch(setSelectedUAVIds([]));
      }
      return;
    }

    this._setSelectedUAVIds([id]);
    store.dispatch(setSelectedUAVIds([id]));
  },

  _onDroneDeselected() {
    const hadSelection = this._selectedUAVIds?.some((id) => this._uavIdToEntity[id]);
    this._setSelectedUAVIds([]);
    if (hadSelection) {
      store.dispatch(setSelectedUAVIds([]));
    }
  },

  _onSelectionChanged(newValue) {
    this._setSelectedUAVIds(newValue);
  },

  _onUAVsAdded(uavs) {
    for (const uav of uavs) {
      const entity = this._ensureUAVEntityExists(uav);
      this.system.updateEntityFromUAV(entity, uav);
    }
  },

  _onUAVsRemoved(uavs) {
    for (const uav of uavs) {
      this._ensureUAVEntityDoesNotExist(uav);
    }
  },

  _onUAVsUpdated(uavs) {
    for (const uav of uavs) {
      const entity = this._getEntityForUAV(uav);
      if (entity) {
        this.system.updateEntityFromUAV(entity, uav);
      }
    }
  },

  _onUAVGeometryChanged() {
    for (const entity of Object.values(this._uavIdToEntity)) {
      this.system.updateEntityGeometry(entity);
    }
    this._setSelectedUAVIds(this._selectedUAVIds);
  },
});

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
import { getPreferredDroneRadius } from '~/features/three-d/selectors';
import flock from '~/flock';
import { uavIdToGlobalId } from '~/model/identifiers';
import { getFlatEarthCoordinateTransformer } from '~/selectors/map';
import store from '~/store';

const { THREE } = AFrame;
const DRONE_BODY_COLOR = 0xff8c00;
const DRONE_ARMED_COLOR = 0x00ff00;
const DRONE_HOVER_COLOR = 0xff0000;

const getDroneBodyColorFromUAV = (uav) =>
  uav.errors.includes(UAVErrorCode.MOTORS_RUNNING_WHILE_ON_GROUND)
    ? DRONE_ARMED_COLOR
    : DRONE_BODY_COLOR;

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
    element.setAttribute('material', {
      color: new THREE.Color(DRONE_BODY_COLOR),
      fog: false,
      shader: 'flat',
    });
    element.setAttribute('position', '0 0 0');

    this.updateEntityGeometry(element);

    return element;
  },

  updateEntityFromUAV(entity, uav) {
    if (uav.hasLocalPosition) {
      this._updatePositionFromLocalCoordinates(
        uav.localPosition,
        entity.object3D.position
      );
    } else if (this._updatePositionFromGPSCoordinates) {
      this._updatePositionFromGPSCoordinates(uav, entity.object3D.position);
    }
    entity.object3D.position.z += this._droneRadius;

    const bodyColor = getDroneBodyColorFromUAV(uav);
    entity.originalColor = bodyColor;
    const mesh = entity.getObject3D('mesh');
    if (mesh) {
      mesh.material.color.setHex(bodyColor);
    } else {
      // TODO(ntamas): sometimes it happens that we get here earlier than the
      // mesh is ready (it's an async process). In this case we should store
      // the color somewhere and attempt setting it again in case there will be
      // no further updates from the UAV for a while
    }
  },

  updateEntityGeometry(entity) {
    entity.setAttribute('geometry', this._droneGeometry);

    // Update edges
    if (entity.edgesLine) {
      entity.object3D.remove(entity.edgesLine);
      entity.edgesLine.geometry.dispose();
      entity.edgesLine.material.dispose();
      entity.edgesLine = null;
    }

    const mesh = entity.getObject3D('mesh');
    if (mesh) {
      const edges = new THREE.EdgesGeometry(mesh.geometry);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xff0000 }));
      line.visible = false;
      entity.object3D.add(line);
      entity.edgesLine = line;
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

    this._uavIdToEntity = {};

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

    this._pendingUAVsToAdd = flock.getAllUAVIds();
  },

  remove() {
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
        entity.addEventListener('mouseenter', () => {
          store.dispatch(setFeatureIdForTooltip(uavIdToGlobalId(id)));
          const mesh = entity.getObject3D('mesh');
          if (mesh) {
            entity.originalColor = entity.originalColor || mesh.material.color.getHex();
            mesh.material.color.setHex(DRONE_HOVER_COLOR);
          }
          if (entity.edgesLine) {
            entity.edgesLine.visible = true;
          }
        });
        entity.addEventListener('mouseleave', () => {
          store.dispatch(setFeatureIdForTooltip(null));
          const mesh = entity.getObject3D('mesh');
          if (mesh && entity.originalColor) {
            mesh.material.color.setHex(entity.originalColor);
          }
          if (entity.edgesLine) {
            entity.edgesLine.visible = false;
          }
        });
        entity.addEventListener('click', (event) => {
          // TODO(ntamas): the click event we receive from A-Frame does not
          // contain the information about whether the Ctrl/Cmd key is pressed.
          // We need to subscribe to keydown/keyup events on our own to record
          // this information and use it.
          store.dispatch(this.system._selectionThunk(event, id));
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

    delete this._uavIdToEntity[uav.id];
  },

  _getEntityForUAV(uav) {
    return this._uavIdToEntity[uav ? uav.id : undefined];
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
  },
});

/**
 * A-Frame component that implements the logic needed to implement a
 * "drone flock" entity consisting of multiple drones backed by a `Flock`
 * instance.
 */

import { createSelector } from '@reduxjs/toolkit';
import watch from 'redux-watch';

import AFrame from '../aframe';

import flock from '~/flock';
import store from '~/store';

import { hideTooltip, showTooltip } from '~/features/three-d/slice';
import { convertRGB565ToHex } from '~/flockwave/parsing';
import { getFlatEarthCoordinateTransformer } from '~/selectors/map';

const { THREE } = AFrame;

/**
 * Returns a function that can be called with two arguments; the first argument
 * must be a object having `lon`, `lat` and `agl` properties, while the second
 * argument must be an existing `THREE.Vector3` vector. The function will update
 * the vector in-place to the coordinates in the 3D view corresponding to the
 * given GPS position.
 *
 * The returned function is designed in a way that it avoids allocating objects
 * to prevent the GC from being triggered too often while updating the
 * coordinates of the drones in the 3D view.
 */
const updatePositionFromGPSCoordinates = createSelector(
  getFlatEarthCoordinateTransformer,
  (transformation) => (coordinate, result) => {
    if (coordinate !== null && coordinate !== undefined) {
      return transformation.updateVector3FromLonLatAgl(
        result,
        coordinate.lon,
        coordinate.lat,
        coordinate.agl
      );
    }
  }
);

AFrame.registerSystem('drone-flock', {
  init() {
    const getter = () => updatePositionFromGPSCoordinates(store.getState());
    store.subscribe(
      watch(getter)((newValue) => {
        this._updatePositionFromGPSCoordinates = newValue;
      })
    );

    this._updatePositionFromGPSCoordinates = getter();
  },

  createNewUAVEntity() {
    const element = document.createElement('a-entity');
    element.setAttribute('geometry', {
      primitive: 'sphere',
      radius: 0.5,
      segmentsHeight: 9,
      segmentsWidth: 18
    });
    element.setAttribute('material', {
      color: new THREE.Color('#0088ff'),
      fog: false,
      shader: 'flat'
    });
    element.setAttribute('position', '0 0 0');

    const glowElement = document.createElement('a-entity');
    glowElement.setAttribute('sprite', {
      blending: 'additive',
      color: new THREE.Color('#ff8800'),
      scale: '2 2 1',
      src: '#glow-texture',
      transparent: true
    });

    element.append(glowElement);

    return element;
  },

  updateEntityFromUAV(entity, uav) {
    if (this._updatePositionFromGPSCoordinates) {
      this._updatePositionFromGPSCoordinates(uav, entity.object3D.position);
    }

    const color = convertRGB565ToHex(uav.light | 0);
    const mesh = entity.getObject3D('mesh');
    if (mesh) {
      mesh.material.color.setHex(color);
    } else {
      // TODO(ntamas): sometimes it happens that we get here earlier than the
      // mesh is ready (it's an async process). In this case we should store
      // the color somewhere and attempt setting it again in case there will be
      // no further updates from the UAV for a while
    }

    // TODO(ntamas): this is quite complex; we probably need to encapsulate the
    // glow as a separate component so we can simplify both the cloning code and
    // this part here.
    //
    // Also, we could cache the glow material somewhere so we don't need to look
    // it up all the time.
    const glowEntity = entity.childNodes[0];
    if (glowEntity) {
      const glowMesh = glowEntity.getObject3D('mesh');
      if (glowMesh && glowMesh.material) {
        glowMesh.material.color.setHex(color);
      }
    }
  },

  _onTransformationChanged(newValue) {
    this._gpsToWorld = newValue;
  }
});

AFrame.registerComponent('drone-flock', {
  schema: {},

  init() {
    this._onUAVsAdded = this._onUAVsAdded.bind(this);
    this._onUAVsRemoved = this._onUAVsRemoved.bind(this);
    this._onUAVsUpdated = this._onUAVsUpdated.bind(this);

    this._uavIdToEntity = {};

    this._signals = {
      uavsAdded: flock.uavsAdded.add(this._onUAVsAdded),
      uavsRemoved: flock.uavsRemoved.add(this._onUAVsRemoved),
      uavsUpdated: flock.uavsUpdated.add(this._onUAVsUpdated)
    };

    this._pendingUAVsToAdd = flock.getAllUAVIds();
  },

  remove() {
    flock.uavsAdded.detach(this._signals.uavsAdded);
    flock.uavsRemoved.detach(this._signals.uavsRemoved);
    flock.uavsUpdated.detach(this._signals.uavsUpdated);
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
          store.dispatch(showTooltip(id));
        });
        entity.addEventListener('mouseleave', () => {
          store.dispatch(hideTooltip());
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
  }
});

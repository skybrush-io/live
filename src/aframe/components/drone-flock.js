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

import { getFlatEarthCoordinateTransformer } from '~/selectors/map';

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
  transformation => (coordinate, result) => {
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
      watch(getter)(newValue => {
        this._updatePositionFromGPSCoordinates = newValue;
      })
    );

    this._updatePositionFromGPSCoordinates = getter();
  },

  createNewUAVEntity({ template }) {
    if (!template) {
      console.error('No UAV entity template to clone');
      return undefined;
    }

    const clone = template.object3D.clone();

    const entity = document.createElement('a-entity');
    entity.setAttribute('visible', true);
    entity.setAttribute('position', '0 0 0');
    entity.object3D = clone;

    return entity;
  },

  updateEntityFromUAV(entity, uav) {
    if (this._updatePositionFromGPSCoordinates) {
      this._updatePositionFromGPSCoordinates(uav, entity.object3D.position);
    }
  },

  _onTransformationChanged(newValue) {
    this._gpsToWorld = newValue;
  }
});

AFrame.registerComponent('drone-flock', {
  schema: {
    template: { type: 'selector' }
  },

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
      const entity = this.system.createNewUAVEntity({
        template: this.data.template
      });

      if (entity) {
        this.el.append(entity);
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

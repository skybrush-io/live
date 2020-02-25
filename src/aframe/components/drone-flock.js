/**
 * A-Frame component that implements the logic needed to implement a
 * "drone flock" entity consisting of multiple drones backed by a `Flock`
 * instance.
 */

import shortid from 'shortid';

import AFrame from '../aframe';

import flock from '~/flock';

let counter = 5;

AFrame.registerSystem('drone-flock', {
  createNewUAVEntity(id, { template }) {
    if (!template) {
      console.error('No UAV entity template to clone');
      return undefined;
    }

    const clone = template.object3D.clone();

    const entity = document.createElement('a-entity');
    entity.setAttribute('id', id);
    entity.setAttribute('visible', true);
    entity.setAttribute('position', `${counter} 0 0`);
    entity.object3D = clone;

    counter++;

    return entity;
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

    this._uavIdToEntityId = {};

    flock.uavsAdded.add(this._onUAVsAdded);
    flock.uavsRemoved.add(this._onUAVsRemoved);
    flock.uavsUpdated.add(this._onUAVsUpdated);

    console.log('drone-flock inited');
  },

  remove() {
    console.log('drone-flock removed');
    flock.uavsAdded.detach(this._onUAVsAdded);
    flock.uavsRemoved.detach(this._onUAVsRemoved);
    flock.uavsUpdated.detach(this._onUAVsUpdated);
  },

  _ensureUAVEntityExists(uav) {
    const existingEntity = this._getEntityForUAV(uav);
    if (!existingEntity) {
      const entityId = this._getEntityIdForUAVId(uav.id);
      const entity = this.system.createNewUAVEntity(entityId, {
        template: this.data.template
      });

      if (entity) {
        this.el.append(entity);
      }
    }
  },

  _getEntityForUAV(uav) {
    const entityId = this._getEntityIdForUAVId(uav.id);
    const { sceneEl } = this.el;
    return sceneEl.querySelector(`#${entityId}`);
  },

  _getEntityIdForUAVId(uavId) {
    if (!uavId) {
      return undefined;
    }

    const result = this._uavIdToEntityId[uavId];
    if (result === undefined) {
      const newResult = `drone-${shortid.generate()}`;
      this._uavIdToEntityId[uavId] = newResult;
      return newResult;
    }

    return result;
  },

  _onUAVsAdded(uavs) {
    for (const uav of uavs) {
      this._ensureUAVEntityExists(uav);
    }
  },

  _onUAVsRemoved(uavs) {
    for (const uav of uavs) {
      const uavId = uav.id;
      const entityId = this._getEntityIdForUAVId(uavId);
      const existingEntity = this._getEntityForUAV(uav);
      if (existingEntity) {
        existingEntity.remove();
      }

      delete this._uavIdToEntityId[uavId];
      console.log('Removed entity', entityId);
    }
  },

  _onUAVsUpdated() {}
});

/**
 * @file Classes, functions and constants related to the representation of
 * a collection (flock) of UAVs.
 */

import { type Response_UAVINF } from 'flockwave-spec';
import isEmpty from 'lodash-es/isEmpty';
import transform from 'lodash-es/transform';
import { MiniSignal } from 'mini-signals';

import UAV from './uav';

/**
 * Representation of a UAV flock.
 */
export default class Flock {
  _uavsById: Record<UAV['id'], UAV>;

  uavsAdded: MiniSignal<[UAV[]]>;
  uavsUpdated: MiniSignal<[UAV[]]>;
  uavsRemoved: MiniSignal<[UAV[]]>;

  /**
   * Constructor.
   *
   * Creates a new flock with no UAVs in it.
   */
  constructor() {
    this._uavsById = {};

    this.uavsAdded = new MiniSignal();
    this.uavsUpdated = new MiniSignal();
    this.uavsRemoved = new MiniSignal();
  }

  /**
   * Creates a new UAV with the given ID. This function assumes that the UAV
   * does not exist yet. The UAV will <em>not</em> be registered in the
   * flock by default.
   *
   * @param id - The identifier of the UAV
   * @returns The UAV with the given ID
   */
  _createUAVById(id: UAV['id']): UAV {
    return new UAV(id);
  }

  /**
   * Returns the IDs of all the UAVs in the flock.
   *
   * @returns The IDs of all the UAVs in the flock, in alphabetical order
   */
  getAllUAVIds(): Array<UAV['id']> {
    return Object.keys(this._uavsById).sort();
  }

  /**
   * Returns all the UAVs in the flock, in an array, in the same order as
   * returned by `getAllUAVIds()`.
   */
  getAllUAVs(): UAV[] {
    const uavIds = this.getAllUAVIds();

    // NOTE: Bang justified by `uavIds` coming from `Object.keys(this._uavsById)`
    return uavIds.map((uavId) => this._uavsById[uavId]!);

    // Alternative solution without relying on the non-null assertion operator:
    // return uavIds
    //   .map((uavId) => this._uavsById[uavId])
    //   .filter((uav?: UAV): uav is UAV => uav !== undefined);
  }

  /**
   * Returns the UAV with the given ID.
   *
   * @param id - The identifier of the UAV
   * @returns The UAV with the given ID or undefined if there is no such UAV
   */
  getUAVById(id: UAV['id']): UAV | undefined {
    return this._uavsById[id];
  }

  /**
   * Returns the UAV with the given ID, creating it with an unknown state
   * if it does not exist yet.
   *
   * @param id - The identifier of the UAV
   * @returns The UAV with the given ID
   */
  getOrCreateUAVById(id: UAV['id']): UAV {
    let uav = this._uavsById[id];
    if (!uav) {
      uav = this._createUAVById(id);
      this._uavsById[id] = uav;
    }

    return uav;
  }

  /**
   * Handles a UAV-INF message from a Skybrush server and updates the state
   * of the flock appropriately.
   *
   * @param body - The body of the UAV-INF message
   * @fires Flock#uavsAdded
   * @fires Flock#uavsUpdated
   */
  handleUAVInformationMessage(body: Response_UAVINF): void {
    // For each UAV ID and status object pair, get the UAV with the given
    // ID, update its own local status, and if the status was updated,
    // remember the UAV ID so we can ask the feature manager to refresh
    // the features of these UAVs

    if (!body.status) {
      return;
    }

    const { addedUAVs, updatedUAVs } = transform(
      body.status,
      (accumulator, status, uavId) => {
        // Code duplicated from getOrCreateUAVById(); this is unfortunate
        // but we need to know whether we have added a UAV or not
        let uav = this.getUAVById(uavId);
        if (!uav) {
          uav = this._createUAVById(uavId);
          this._uavsById[uavId] = uav;
          accumulator.addedUAVs.push(uav);
        }

        const updated = uav.handleUAVStatusInfo(status);
        if (updated) {
          accumulator.updatedUAVs.push(uav);
        }
      },
      {
        addedUAVs: new Array<UAV>(),
        updatedUAVs: new Array<UAV>(),
      }
    );

    if (!isEmpty(addedUAVs)) {
      this.uavsAdded.dispatch(addedUAVs);
    }

    if (!isEmpty(updatedUAVs)) {
      this.uavsUpdated.dispatch(updatedUAVs);
    }
  }

  /**
   * Removes a UAV given its ID, and dispatches an appropriate event.
   */
  removeUAVById(id: UAV['id']): void {
    this.removeUAVsByIds([id]);
  }

  /**
   * Removes multiple UAVs given their IDs, and dispatches an appropriate event.
   *
   * @fires Flock#uavsRemoved
   */
  removeUAVsByIds(ids: Array<UAV['id']>): void {
    const removedUAVs = [];

    for (const id of ids) {
      const uav = this._uavsById[id];
      if (uav !== undefined) {
        removedUAVs.push(uav);
        delete this._uavsById[id];
      }
    }

    if (!isEmpty(removedUAVs)) {
      this.uavsRemoved.dispatch(removedUAVs);
    }
  }
}

/**
 * Event that is dispatched by a {@link Flock} object when new UAVs have
 * been added to the flock.
 *
 * The event contains an array of the UAVs that were added.
 *
 * @event  Flock#uavsAdded
 * @type {UAV[]}
 */

/**
 * Event that is dispatched by a {@link Flock} object when some UAVs have
 * been removed from the flock.
 *
 * The event contains an array of the UAVs that were removed.
 *
 * @event  Flock#uavsRemoved
 * @type {UAV[]}
 */

/**
 * Event that is dispatched by a {@link Flock} object when some of the
 * UAVs have been updated.
 *
 * The event contains an array of the UAVs that were updated.
 *
 * @event  Flock#uavsUpdated
 * @type {UAV[]}
 */

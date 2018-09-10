/**
 * @file Classes, functions and constants related to the representation of
 * a collection (flock) of UAVs.
 */

import _ from 'lodash'
import Signal from 'mini-signals'

import UAV from './uav'

/**
 * Representation of a UAV flock.
 */
export default class Flock {
  /**
   * Constructor.
   *
   * Creates a new flock with no UAVs in it.
   */
  constructor () {
    this._uavs = []
    this._uavsById = {}
    this.uavsAdded = new Signal()
    this.uavsUpdated = new Signal()
    this.uavsRemoved = new Signal()
  }

  /**
   * Creates a new UAV with the given ID. This function assumes that the UAV
   * does not exist yet. The UAV will <em>not</em> be registered in the
   * flock by default.
   *
   * @param {string}  id  the identifier of the UAV
   * @return {UAV}  the UAV with the given ID
   */
  _createUAVById (id) {
    return new UAV(id)
  }

  /**
   * Returns the IDs of all the UAVs in the flock.
   *
   * @return {string[]}  the IDs of all the UAVs in the flock, in alphabetic
   *         order
   */
  getAllUAVIds () {
    return _.keys(this._uavsById).sort()
  }

  /**
   * Returns the UAV with the given ID.
   *
   * @param {string}  id  the identifier of the UAV
   * @return {UAV}  the UAV with the given ID or undefined if there is no
   *         such UAV
   */
  getUAVById (id) {
    return this._uavsById[id]
  }

  /**
   * Returns the UAV with the given ID, creating it with an unknown state
   * if it does not exist yet.
   *
   * @param {string}  id  the identifier of the UAV
   * @return {UAV}  the UAV with the given ID
   */
  getOrCreateUAVById (id) {
    let uav = this._uavsById[id]
    if (!uav) {
      this._uavsById[id] = uav = this._createUAVById(id)
    }
    return uav
  }

  /**
   * Handles a UAV-INF message from a Flockwave server and updates the state
   * of the flock appropriately.
   *
   * @param  {Object} body  the body of the UAV-INF message
   * @param  {function} dispatch  the dispatch function of the Redux store
   * @fires  Flock#uavsUpdated
   */
  handleUAVInformationMessage (body, dispatch) {
    // For each UAV ID and status object pair, get the UAV with the given
    // ID, update its own local status, and if the status was updated,
    // remember the UAV ID so we can ask the feature manager to refresh
    // the features of these UAVs

    // body.status is frozen so we unfreeze it first
    const { addedUAVs, updatedUAVs } = _(body.status).transform(
      (accumulator, status, uavId) => {
        // Code duplicated from getOrCreateUAVById(); this is unfortunate
        // but we need to know whether we have added a UAV or not
        let uav = this.getUAVById(uavId)
        if (!uav) {
          this._uavsById[uavId] = uav = this._createUAVById(uavId)
          accumulator.addedUAVs.push(uav)
        }

        const updated = uav.handleUAVStatusInfo(status)
        if (updated) {
          accumulator.updatedUAVs.push(uav)
        }
      }, {
        addedUAVs: [],
        updatedUAVs: []
      }).value()

    if (!_.isEmpty(addedUAVs)) {
      this.uavsAdded.dispatch(addedUAVs)
    }
    if (!_.isEmpty(updatedUAVs)) {
      this.uavsUpdated.dispatch(updatedUAVs)
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

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
    this.uavsUpdated = new Signal()
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
    const updatedUAVs = _(body.status).transform(
      (updatedUAVs, status, uavId) => {
        const uav = this.getOrCreateUAVById(uavId)
        const updated = uav.handleUAVStatusInfo(status)
        if (updated) {
          updatedUAVs.push(uav)
        }
      }, []).value()

    if (!_.isEmpty(updatedUAVs)) {
      this.uavsUpdated.dispatch(updatedUAVs)
    }
  }
}

/**
 * Event that is dispatched by a {@link Flock} object when some of the
 * UAVs have been updated.
 *
 * The event contains an array of the UAVs that were updated.
 *
 * @event  Flock#uavsUpdated
 * @type {UAV[]}
 */

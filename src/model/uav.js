/**
 * @file Classes, functions and constants related to the representation of
 * an UAV.
 */

import _ from 'lodash'

/**
 * Representation of a single UAV.
 */
export default class UAV {

  /**
   * Constructor.
   *
   * Creates a new UAV with no known position.
   *
   * @param {string} id  the ID of the UAV
   */
  constructor (id) {
    this._id = id
    this.lastUpdated = undefined
    this.lat = undefined
    this.lon = undefined
    this.heading = undefined
    this.error = undefined
  }

  /**
   * Returns the ID of the UAV.
   *
   * @return {string}  the ID of the UAV
   */
  get id () {
    return this._id
  }

  /**
   * Handles the status information related to a single UAV from an UAV-INF
   * message.
   *
   * @param {Object} status  the status information of this UAV from an
   *        UAV-INF message
   * @return {boolean}  whether the status information has been updated
   */
  handleUAVStatusInfo (status) {
    const { timestamp, position, heading, error } = status
    let updated = false

    if (timestamp) {
      this.lastUpdated = new Date(timestamp)
      updated = true
    }

    if (position) {
      this.lat = position.lat
      this.lon = position.lon
      updated = true
    }

    if (typeof heading !== 'undefined') {
      this.heading = heading
      updated = true
    }

    if (!_.isEqual(this.error, error)) {
      this.error = error
      updated = true
    }

    return updated
  }
}

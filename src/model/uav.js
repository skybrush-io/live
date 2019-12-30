/**
 * @file Classes, functions and constants related to the representation of
 * an UAV.
 */

import isEqual from 'lodash-es/isEqual';
import isNil from 'lodash-es/isNil';

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
  constructor(id) {
    this._id = id;
    this.lastUpdated = undefined;
    this.agl = undefined;
    this.amsl = undefined;
    this.lat = undefined;
    this.lon = undefined;
    this.heading = undefined;
    this.error = undefined;
    this.battery = { voltage: undefined, percentage: undefined };
  }

  /**
   * Returns the ID of the UAV.
   *
   * @return {string}  the ID of the UAV
   */
  get id() {
    return this._id;
  }

  /**
   * Handles the status information related to a single UAV from an UAV-INF
   * message.
   *
   * @param {Object} status  the status information of this UAV from an
   *        UAV-INF message
   * @return {boolean}  whether the status information has been updated
   */
  handleUAVStatusInfo = status => {
    const { timestamp, position, heading, error, battery } = status;
    let updated = false;

    if (timestamp) {
      this.lastUpdated = new Date(timestamp);
      updated = true;
    }

    if (position) {
      this.lat = position[0] / 1e7;
      this.lon = position[1] / 1e7;
      if (!isNil(position[2])) {
        this.agl = position.agl / 1e3;
      }

      if (!isNil(position[3])) {
        this.amsl = position.amsl / 1e3;
      }

      updated = true;
    }

    if (heading !== undefined) {
      this.heading = heading / 10; /* conversion to degrees */
      updated = true;
    }

    if (!isEqual(this.error, error)) {
      this.error = error;
      updated = true;
    }

    if (battery && battery.voltage !== this.battery.voltage) {
      battery.voltage /= 10; /* conversion to volts */
      this.battery = battery;
      updated = true;
    }

    return updated;
  };
}

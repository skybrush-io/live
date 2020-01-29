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
    this._errors = [];
    this._position = {
      lat: undefined,
      lon: undefined,
      amsl: undefined,
      agl: undefined
    };
    this._rawHeading = undefined;
    this._rawVoltage = undefined;

    this.battery = { voltage: undefined, percentage: undefined };
    this.heading = undefined;
    this.lastUpdated = undefined;
  }

  /**
   * Returns the altitude above ground level, if known.
   */
  get agl() {
    return this._position.agl;
  }

  /**
   * Returns the altitude above mean sea level, if known.
   */
  get amsl() {
    return this._position.amsl;
  }

  /**
   * Returns a single error code from the list of error codes sent by the
   * UAV, or undefined if there are no errors.
   */
  get error() {
    return this._errors && this._errors.length > 0
      ? this._errors[0]
      : undefined;
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
   * Returns the latitude of the UAV, if known.
   */
  get lat() {
    return this._position.lat;
  }

  /**
   * Returns the longitude of the UAV, if known.
   */
  get lon() {
    return this._position.lon;
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
    const { timestamp, position, heading, errors, battery } = status;
    let errorList;
    let updated = false;

    if (timestamp) {
      this.lastUpdated = timestamp;
      updated = true;
    }

    if (position) {
      this._position.lat = position[0] / 1e7;
      this._position.lon = position[1] / 1e7;
      if (!isNil(position[2])) {
        this._position.amsl = position[2] / 1e3;
      }

      if (!isNil(position[3])) {
        this._position.agl = position[3] / 1e3;
      }

      updated = true;
    }

    if (heading !== undefined && this._rawHeading !== heading) {
      this._rawHeading = heading;
      this.heading = heading / 10; /* conversion to degrees */
      updated = true;
    }

    if (Array.isArray(errors)) {
      errorList = errors;
    } else {
      errorList = errors ? [errors] : [];
    }

    if (!isEqual(this._errors, errorList)) {
      this._errors.splice(0, this._errors.length, ...errorList);
      updated = true;
    }

    if (Array.isArray(battery)) {
      let newVoltageRaw;
      let newPercentage;

      if (battery.length > 0) {
        newVoltageRaw = Number.parseInt(battery[0], 10);
        if (battery.length > 1) {
          newPercentage = Number.parseInt(battery[1], 10);
        }
      }

      if (newPercentage !== battery.percentage) {
        this.battery.percentage = newPercentage;
        updated = true;
      }

      if (newVoltageRaw !== this._rawVoltage) {
        this._rawVoltage = battery.voltage;
        this.battery.voltage = newVoltageRaw / 10;
        updated = true;
      }
    }

    return updated;
  };

  /**
   * Returns a pure JavaScript object representation of the UAV that can be
   * used in a Redux store.
   */
  toJSON() {
    return {
      id: this._id,
      battery: { ...this.battery },
      errors: [...this._errors],
      heading: this.heading,
      lastUpdated: this.lastUpdated,
      position: { ...this._position }
    };
  }
}

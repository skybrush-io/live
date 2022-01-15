/**
 * @file Classes, functions and constants related to the representation of
 * an UAV.
 */

import { Base64 } from 'js-base64';
import isEqual from 'lodash-es/isEqual';
import isNil from 'lodash-es/isNil';
import range from 'lodash-es/range';

import { GPSFixType } from './enums';

/**
 * Age constants for a UAV. Used in the Redux store to mark UAVs for which we
 * have not received a status update for a while.
 */
export const UAVAge = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  GONE: 'gone',
  FORGOTTEN: 'forgotten',
};

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
    this._debug = undefined;
    this._debugAsByteArray = undefined;
    this._debugString = undefined;

    this._id = id;
    this._errors = [];
    this._position = {
      lat: undefined,
      lon: undefined,
      amsl: undefined,
      agl: undefined,
    };
    this._rawHeading = undefined;
    this._rawVoltage = undefined;

    this.battery = {
      voltage: undefined,
      percentage: undefined,
    };
    this.gpsFix = {
      type: GPSFixType.NO_GPS,
      numSatellites: undefined,
    };
    this.heading = undefined;
    this.lastUpdated = undefined;
    this.light = 0xffff; /* white in RGB565 */
    this.localPosition = [undefined, undefined, undefined];
    this.mode = undefined;
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
   * Returns the debug information associated with the UAV as a byte array
   * (not as a string).
   */
  get debug() {
    if (this._debugAsByteArray === undefined && this._debug !== undefined) {
      try {
        const data = Base64.atob(this._debug);
        const n = data.length;
        this._debugAsByteArray = new Uint8Array(new ArrayBuffer(n));
        for (let i = 0; i < n; i++) {
          this._debugAsByteArray[i] = data.charCodeAt(i);
        }
      } catch {
        this._debugAsByteArray = new Uint8Array();
      }
    }

    return this._debugAsByteArray;
  }

  /**
   * Returns the debug information associated with the UAV as a string, replacing
   * non-printable characters with a dot.
   */
  get debugString() {
    if (this._debugString === undefined && this._debug !== undefined) {
      const array = this.debug;
      this._debugString = range(array.length)
        .map((index) =>
          array[index] >= 32 && array[index] < 128
            ? String.fromCharCode(array[index])
            : '.'
        )
        .join('');
    }

    return this._debugString;
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
   * Returns whether the UAV has a known local position.
   */
  get hasLocalPosition() {
    return !isNil(this.localPosition[0]);
  }

  /**
   * Handles the status information related to a single UAV from an UAV-INF
   * message.
   *
   * @param {Object} status  the status information of this UAV from an
   *        UAV-INF message
   * @return {boolean}  whether the status information has been updated
   */
  /* eslint-disable complexity */
  handleUAVStatusInfo = (status) => {
    const {
      timestamp,
      position,
      positionXYZ,
      heading,
      mode,
      gps,
      errors,
      battery,
      light,
      debug,
    } = status;
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

    if (positionXYZ && Array.isArray(positionXYZ) && positionXYZ.length >= 3) {
      this.localPosition[0] = positionXYZ[0] / 1e3;
      this.localPosition[1] = positionXYZ[1] / 1e3;
      this.localPosition[2] = positionXYZ[2] / 1e3;
      updated = true;
    }

    if (heading !== undefined && this._rawHeading !== heading) {
      this._rawHeading = heading;
      this.heading = heading / 10; /* conversion to degrees */
      updated = true;
    }

    if (light !== undefined && this.light !== light) {
      this.light = light;
      updated = true;
    }

    if (mode !== undefined && this.mode !== mode) {
      this.mode = mode;
      updated = true;
    }

    if (gps !== undefined && Array.isArray(gps)) {
      this.gpsFix.type = gps.length > 0 ? gps[0] : GPSFixType.NO_GPS;
      this.gpsFix.numSatellites =
        gps.length > 1 && typeof gps[1] === 'number' ? gps[1] : undefined;
      updated = true;
    }

    if (debug !== undefined && this._debug !== debug) {
      this._debug = debug;
      this._debugAsByteArray = undefined;
      this._debugString = undefined;
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

      const newCharging = battery.length > 2 ? Boolean(battery[2]) : false;

      if (newPercentage !== battery.percentage) {
        this.battery.percentage = newPercentage;
        updated = true;
      }

      if (newVoltageRaw !== this._rawVoltage) {
        this._rawVoltage = battery.voltage;
        this.battery.voltage = newVoltageRaw / 10;
        updated = true;
      }

      if (newCharging !== this.battery.charging) {
        this.battery.charging = newCharging;
        updated = true;
      }
    }

    return updated;
  };
  /* eslint-enable complexity */

  /**
   * Returns a pure JavaScript object representation of the UAV that can be
   * used in a Redux store.
   */
  toJSON() {
    /* Null Island is treated as "no position info" */
    const position =
      this._position.lat && this._position.lon ? { ...this._position } : null;
    const localPosition = !isNil(this.localPosition[0])
      ? [...this.localPosition]
      : null;
    return {
      id: this._id,
      age: this.age,
      battery: { ...this.battery },
      debugString: this.debugString,
      errors: [...this._errors],
      gpsFix: { ...this.gpsFix },
      heading: this.heading,
      lastUpdated: this.lastUpdated,
      light: this.light,
      mode: this.mode,
      localPosition,
      position,
    };
  }
}

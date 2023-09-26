/**
 * @file Classes, functions and constants related to the representation of
 * an UAV.
 */

import { type UAVStatusInfo } from 'flockwave-spec';
import { Base64 } from 'js-base64';
import isEqual from 'lodash-es/isEqual';
import isNil from 'lodash-es/isNil';

import { type StoredUAV } from '~/features/uavs/types';
import { type ErrorCode } from '~/flockwave/errors';
import { type Coordinate3D } from '~/utils/math';

import { GPSFixType } from './enums';
import { type GPSFix, type GPSPosition } from './position';

/**
 * Age constants for a UAV. Used in the Redux store to mark UAVs for which we
 * have not received a status update for a while.
 */
export enum UAVAge {
  ACTIVE = 'active',
  INACTIVE = 'inactive', // means "no telemetry" in a while
  GONE = 'gone',
  FORGOTTEN = 'forgotten',
}

export type UAVBattery = {
  voltage?: number;
  percentage?: number;
  charging?: boolean;
};

/**
 * Representation of a single UAV.
 */
export default class UAV {
  // TODO: Properly hide private properties with `#` once it's
  //       ensured that they are not accessed from the outside.
  _debug?: string;
  _debugAsByteArray?: Uint8Array;
  _debugString?: string;
  _errors: ErrorCode[];
  _id: string;
  _mostSevereError: ErrorCode;
  _position?: GPSPosition;
  age?: UAVAge;
  battery: UAVBattery;
  gpsFix: GPSFix;
  heading?: number;
  lastUpdated?: number;
  light: number /* RGB565 */;
  localPosition?: Coordinate3D;
  mode?: string;

  /**
   * Constructor.
   *
   * Creates a new UAV with no known position.
   *
   * @param id - The ID of the UAV
   */
  constructor(id: string) {
    this._debug = undefined;
    this._debugAsByteArray = undefined;
    this._debugString = undefined;

    this._id = id;
    this._errors = [];
    this._mostSevereError = 0;
    this._position = undefined;

    this.battery = {
      voltage: undefined,
      percentage: undefined,
      charging: undefined,
    };
    this.gpsFix = {
      type: GPSFixType.NO_GPS,
      numSatellites: undefined,
      horizontalAccuracy: undefined,
      verticalAccuracy: undefined,
    };
    this.heading = undefined;
    this.lastUpdated = undefined;
    this.light = 0xffff; /* white in RGB565 */
    this.localPosition = undefined;
    this.mode = undefined;
  }

  /**
   * Returns the altitude above ground level, if known.
   */
  get agl(): number | undefined {
    return this._position?.agl;
  }

  /**
   * Returns the altitude above home level, if known.
   */
  get ahl(): number | undefined {
    return this._position?.ahl;
  }

  /**
   * Returns the altitude above mean sea level, if known.
   */
  get amsl(): number | undefined {
    return this._position?.amsl;
  }

  /**
   * Returns the debug information associated with the UAV as a byte array
   * (not as a string).
   */
  get debug(): Uint8Array | undefined {
    if (this._debugAsByteArray === undefined && this._debug !== undefined) {
      try {
        const data = Base64.atob(this._debug);
        this._debugAsByteArray = new Uint8Array(new ArrayBuffer(data.length));
        for (let i = 0; i < data.length; i++) {
          // NOTE: Bang justified by `i < data.length`
          this._debugAsByteArray[i] = data.codePointAt(i)!;
        }
      } catch {
        this._debugAsByteArray = new Uint8Array();
      }
    }

    return this._debugAsByteArray;
  }

  /**
   * Returns the debug information associated with the UAV as a string,
   * replacing non-printable characters with a dot.
   */
  get debugString(): string | undefined {
    if (this._debugString === undefined && this.debug !== undefined) {
      this._debugString = Array.from(this.debug)
        .map((c) => (c >= 32 && c < 128 ? String.fromCodePoint(c) : '.'))
        .join('');
    }

    return this._debugString;
  }

  /**
   * Returns a single error code from the list of error codes sent by the
   * UAV, or undefined if there are no errors.
   */
  get error(): ErrorCode | undefined {
    return this._errors && this._errors.length > 0
      ? this._errors[0]
      : undefined;
  }

  /**
   * Returns the list of error codes sent by the UAV.
   */
  get errors(): ErrorCode[] {
    return this._errors;
  }

  /**
   * Returns the ID of the UAV.
   */
  get id(): string {
    return this._id;
  }

  /**
   * Returns the latitude of the UAV, if known.
   */
  get lat(): number | undefined {
    return this._position?.lat;
  }

  /**
   * Returns the longitude of the UAV, if known.
   */
  get lon(): number | undefined {
    return this._position?.lon;
  }

  /**
   * Returns the most severe error code from the list of error codes sent by the
   * UAV, or zero if there are no errors.
   */
  get mostSevereError(): ErrorCode {
    return this._mostSevereError;
  }

  /**
   * Returns whether the UAV has a known local position.
   */
  get hasLocalPosition(): boolean {
    return !isNil(this.localPosition);
  }

  /**
   * Handles the status information related to a single UAV from an UAV-INF
   * message.
   *
   * @param status - The status information of this UAV from an UAV-INF message
   * @returns Whether the status information has been updated
   */
  /* eslint-disable complexity */
  handleUAVStatusInfo = (status: UAVStatusInfo): boolean => {
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
    let errorList: ErrorCode[];
    let updated = false;

    if (timestamp) {
      this.lastUpdated = timestamp;
      updated = true;
    }

    if (position) {
      this._position = {
        lat: position[0] / 1e7,
        lon: position[1] / 1e7,
        amsl: isNil(position[2]) ? undefined : position[2] / 1e3,
        ahl: isNil(position[3]) ? undefined : position[3] / 1e3,
        agl: isNil(position[4]) ? undefined : position[4] / 1e3,
      };
      updated = true;
    }

    if (positionXYZ && Array.isArray(positionXYZ) && positionXYZ.length >= 3) {
      this.localPosition = [
        positionXYZ[0] / 1e3,
        positionXYZ[1] / 1e3,
        positionXYZ[2] / 1e3,
      ];
      updated = true;
    }

    if (heading !== undefined && this.heading !== heading / 10) {
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
      this.gpsFix.horizontalAccuracy =
        typeof gps[2] === 'number' ? gps[2] / 1e3 : undefined;
      this.gpsFix.verticalAccuracy =
        typeof gps[3] === 'number' ? gps[3] / 1e3 : undefined;
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
      this._mostSevereError = Math.max(0, ...this._errors);
      updated = true;
    }

    if (Array.isArray(battery)) {
      const [newVoltageRaw, newPercentage, newCharging] = battery;

      if (this.battery.voltage !== newVoltageRaw / 10) {
        this.battery.voltage = newVoltageRaw / 10;
        updated = true;
      }

      if (this.battery.percentage !== newPercentage) {
        this.battery.percentage = newPercentage;
        updated = true;
      }

      if (this.battery.charging !== newCharging) {
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
  toJSON(): StoredUAV {
    /* Null Island is treated as "no position info" */
    const position =
      this._position?.lat && this._position?.lon
        ? { ...this._position }
        : undefined;
    const localPosition = this.hasLocalPosition
      ? structuredClone(this.localPosition)
      : undefined;

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

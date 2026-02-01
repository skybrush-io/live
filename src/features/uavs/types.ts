import type UAVErrorCode from '~/flockwave/UAVErrorCode';
import { type GPSFix, type GPSPosition } from '~/model/geography';
import { type UAVAge, type UAVBattery } from '~/model/uav';
import { type VelocityNED, type VelocityXYZ } from '~/model/velocity';
import { type Identifier } from '~/utils/collections';
import { type Coordinate3D } from '~/utils/math';

/**
 * Serialized information about a UAV.
 *
 * @example
 * {
 *     id: "01",
 *     lastUpdated: 1580225775722,
 *     position: {
 *         lat: 47.4732476,
 *         lon: 19.0618718,
 *         amsl: undefined,
 *         ahl: 0,
 *         agl: undefined,
 *     },
 *     gpsFix: ['3D', 17, 0.25, 0.56],
 *     heading: 210,
 *     errors: [],
 *     battery: {
 *         voltage: 10.4,
 *         percentage: 41,
 *         charging: true
 *     },
 *     localPosition: [1, 2, 3],
 *     age: "active" // one of 'active', 'inactive', 'gone'
 *     velocity: [0, 0, 1000],
 *     rssi: [100],
 * }
 */
export type StoredUAV = {
  age?: UAVAge;
  battery: UAVBattery;
  debugString?: string;
  errors: UAVErrorCode[];
  gpsFix: GPSFix;
  heading?: number;
  id: Identifier;
  lastUpdated?: number;
  light: number /* RGB565 */;
  localPosition?: Coordinate3D;
  localVelocity?: VelocityXYZ;
  mode?: string;
  position?: GPSPosition;
  velocity?: VelocityNED;
  rssi: number[];
};

export enum UAVDetailsDialogTab {
  LOGS = 'logs',
  MESSAGES = 'messages',
  PREFLIGHT = 'preflight',
  TESTS = 'tests',
}

export enum UAVDetailsPanelTab {
  LOGS = 'logs',
  MESSAGES = 'messages',
  PREFLIGHT = 'preflight',
  TESTS = 'tests',
}

/**
 * Altitude reference types for drone shows.
 */
export enum AltitudeReference {
  AHL = 'ahl',
  AMSL = 'amsl',
}

export type AltitudeReferenceSpecification = {
  type: AltitudeReference;
  value: number;
};

/**
 * Takeoff heading modes for drone shows.
 *
 * `NONE` means that there is no desired takeoff heading for the drones in the
 * show; the operator is free to orient the drones towards any direction and
 * no validations will be performed.
 *
 * `ABSOLUTE` means that the takeoff heading is specified as an absolute
 * compass direction.
 *
 * `RELATIVE` means that the takeoff heading is specified as an offset from the
 * orientation of the X axis of the show.
 */
export enum TakeoffHeadingMode {
  NONE = 'none',
  ABSOLUTE = 'absolute',
  RELATIVE = 'relative',
}

export type TakeoffHeadingSpecification = {
  type: TakeoffHeadingMode;
  value: number;
};

/**
 * Default altitude reference object if it is not defined in the state yet.
 */
export const DEFAULT_ALTITUDE_REFERENCE = {
  type: AltitudeReference.AHL,
  value: 0,
} as const;

/**
 * Default takeoff heading specification if it is not defined in the state yet.
 */
export const DEFAULT_TAKEOFF_HEADING = {
  type: TakeoffHeadingMode.RELATIVE,
  value: 0,
} as const;

/**
 * Default room size.
 */
export const DEFAULT_ROOM_SIZE = {
  width: 12,
  depth: 12,
  height: 6,
} as const;

/**
 * Type of the upload job corresponding to show uploads.
 */
export const JOB_TYPE = 'showUpload';

/**
 * Singleton job that represents the uploading of the current show to the drones.
 */
export const SHOW_UPLOAD_JOB = Object.freeze({
  type: JOB_TYPE,
});

/**
 * Maximum number of drones that we support in a single show.
 */
export const MAX_DRONE_COUNT = 5000;

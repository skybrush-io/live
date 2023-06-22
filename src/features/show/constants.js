/**
 * Coordinate system type for drone shows.
 */
export const COORDINATE_SYSTEM_TYPE = 'nwu';

/**
 * Altitude reference types for drone shows.
 */
export const AltitudeReference = {
  AHL: 'ahl',
  AMSL: 'amsl',
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
export const TakeoffHeadingMode = {
  NONE: 'none',
  ABSOLUTE: 'absolute',
  RELATIVE: 'relative',
};

/**
 * Default altitude reference object if it is not defined in the state yet.
 */
export const DEFAULT_ALTITUDE_REFERENCE = {
  type: AltitudeReference.AHL,
  value: 0,
};

/**
 * Default takeoff heading specification if it is not defined in the state yet.
 */
export const DEFAULT_TAKEOFF_HEADING = {
  type: TakeoffHeadingMode.RELATIVE,
  value: 0,
};

/**
 * Default room size.
 */
export const DEFAULT_ROOM_SIZE = {
  width: 12,
  depth: 12,
  height: 6,
};

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

/**
 * Coordinate system type for drone shows.
 */
export const COORDINATE_SYSTEM_TYPE = 'nwu';

/**
 * Altitude reference types for drone shows.
 */
export const ALTITUDE_REFERENCE = {
  AGL: 'agl',
  AMSL: 'amsl',
};

/**
 * Default altitude reference object if it is not defined in the state yet.
 */
export const DEFAULT_ALTITUDE_REFERENCE = {
  type: ALTITUDE_REFERENCE.AGL,
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
export const MAX_DRONE_COUNT = 1000;

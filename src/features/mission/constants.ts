/**
 * Type of the upload job corresponding to mission item uploads.
 */
export const JOB_TYPE = 'missionItemUpload';

/**
 * Singleton job that represents the uploading of the current mission items to
 * the drones.
 */
export const MISSION_ITEM_UPLOAD_JOB = Object.freeze({
  type: JOB_TYPE,
});

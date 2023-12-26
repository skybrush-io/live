/**
 * Returns whether a yaw control object "looks like" a valid yaw control specification.
 */
export const isValidYawControl = (yawControl) =>
  typeof yawControl === 'object' &&
  yawControl.version === 1 &&
  typeof yawControl.setpoints === 'object' &&
  Array.isArray(yawControl.setpoints);

/**
 * Returns whether the yaw of a drone is actively controlled if it has the given
 * yaw control specification.
 */
export const isYawActivelyControlled = (yawControl) =>
  isValidYawControl(yawControl) &&
  (yawControl.setpoints.length > 0 || Boolean(yawControl.autoYaw));

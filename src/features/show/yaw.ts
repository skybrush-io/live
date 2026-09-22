import type { YawControl } from '@skybrush/show-format';

/**
 * Returns whether the yaw of a drone is actively controlled if it has the given
 * yaw control specification.
 */
export const isYawActivelyControlled = (
  yawControl: YawControl | undefined
): boolean =>
  yawControl !== undefined &&
  (yawControl.setpoints.length > 0 || Boolean(yawControl.autoYaw));

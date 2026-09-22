export type CollectiveRTHConfig = {
  min_distance?: number;
  time_resolution?: number;
  velocity_xy?: number;
  velocity_z?: number;
};

/**
 * Parameters of a collective RTH plan calculation, in the naming convention used by
 * the UI, fully specified. `Partial<CollectiveRTHParameters>` maps to
 * `CollectiveRTHConfig` on the wire.
 */
export type CollectiveRTHParameters = {
  minDistance: number;
  timeResolution: number;
  horizontalVelocity: number;
  verticalVelocity: number;
};

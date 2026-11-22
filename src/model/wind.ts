/**
 * Horizontal wind estimate of a single UAV.
 */
export type WindEstimate = {
  /** Wind speed in m/s */
  speed: number;

  /**
   * Meteorological direction, i.e. the direction the wind blows from, in
   * degrees, measured clockwise from North.
   */
  direction: number;
};

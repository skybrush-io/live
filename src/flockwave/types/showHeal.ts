/**
 * Geodetic position as [lat, lon, amsl], where latitude and longitude are
 * scaled up by 1e7 and AMSL is given in millimeters.
 */
export type ScaledGeodeticPosition = [number, number, number];

/**
 * Required configuration of a show healing request.
 */
export type ShowHealConfig = {
  /** 0-based index of the drone in the show to be replaced */
  drone_index: number;
  /** Proposed start time of the healing drone, in seconds of show time */
  start_time: number;
  /** Current position of the replacement drone */
  start_position: ScaledGeodeticPosition;
};

/**
 * Environment of the show to be healed.
 */
export type ShowHealEnvironment = {
  location: {
    /**
     * Show origin as [lat, lon, amsl], scaled the same way as
     * `ScaledGeodeticPosition`
     */
    origin: ScaledGeodeticPosition;
    orientation: number;
  };
};

export type Response_XSHOWHEAL = {
  type: 'X-SHOW-HEAL';
  show: string;
  reason?: string;
  [k: string]: unknown;
};

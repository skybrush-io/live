/**
 * Common implementation of height and distance limits.
 */
const createLimitProposal =
  ({ rounding, minimum }: { rounding: number; minimum: number }) =>
  (maxValue: number, margin: number): number => {
    // Round up to nearest number divisible by the rounding factor so we have a nice number that
    // we can present on the UI. Always propose a minimum height limit of 30
    // meters to allow for manual test flights if needed.
    return Math.max(
      minimum || rounding,
      Math.ceil(((maxValue || 0) + margin) / rounding) * rounding
    );
  };

/**
 * Proposes a height limit for a geofence, assuming the given maximum altitude
 * in the mission and the given safety margin.
 */
export const proposeDistanceLimit = createLimitProposal({
  minimum: 30,
  rounding: 10,
});

/**
 * Proposes a height limit for a geofence, assuming the given maximum altitude
 * in the mission and the given safety margin.
 */
export const proposeHeightLimit = createLimitProposal({
  minimum: 30,
  rounding: 10,
});

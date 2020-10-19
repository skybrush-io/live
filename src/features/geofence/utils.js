/**
 * Proposes a height limit for a geofence, assuming the given maximum altitude
 * in the mission and the given safety margin.
 */
export function proposeHeightLimit(maxHeight, margin) {
  // Round up to nearest number divisible by 10 so we have a nice number that
  // we can present on the UI. Always propose a minimum height limit of 30
  // meters to allow for manual test flights if needed.
  return Math.max(30, Math.ceil((maxHeight + margin) / 10) * 10);
}

/**
 * Returns the given number of degrees in radians.
 *
 * @param  {number} x  the degrees to convert
 * @return {number} the converted degrees in radians
 */
export function toRadians(x) {
  return (x * Math.PI) / 180;
}

export const degrees = toRadians;

/**
 * Returns the given number of radians in degrees.
 *
 * @param  {number} x  the radians to convert
 * @return {number} the converted radians in degrees
 */
export function toDegrees(x) {
  return (x * 180) / Math.PI;
}

export const radians = toDegrees;

/**
 * Converts a center, an angle and a radius in polar coordinates into Cartesian
 * coordinates.
 *
 * The angle is assumed to be increasing counter-clockwise; zero points to the
 * East.
 *
 * @param  {number[]} center  the center coordinate at radius zero
 * @param  {number} angle   the angle
 * @param  {number} radius  the radius
 * @return {number[]}  the Cartesian coordinates equivalent to the input polar
 *         coordinates
 */
export function polarCCW({ center = [0, 0], angle, radius = 1 }) {
  const rad = toRadians(angle);
  return [
    center[0] + radius * Math.cos(rad),
    center[1] + radius * Math.sin(rad),
  ];
}

/**
 * Converts a center, an angle and a radius in polar coordinates into Cartesian
 * coordinates.
 *
 * The angle is assumed to be increasing clockwise; zero points to the East.
 *
 * @param  {number[]} center  the center coordinate at radius zero
 * @param  {number} angle   the angle
 * @param  {number} radius  the radius
 * @return {number[]}  the Cartesian coordinates equivalent to the input polar
 *         coordinates
 */
export function polarCW({ center, angle, radius = 1 }) {
  const rad = toRadians(-angle);
  return [
    center[0] + radius * Math.cos(rad),
    center[1] + radius * Math.sin(rad),
  ];
}

/**
 * Converts a center, an angle and a radius in polar coordinates into Cartesian
 * coordinates.
 *
 * The angle is assumed to be increasing clockwise; zero points to the North.
 *
 * @param  {number[]} center  the center coordinate at radius zero
 * @param  {number} angle   the angle
 * @param  {number} radius  the radius
 * @return {number[]}  the Cartesian coordinates equivalent to the input polar
 *         coordinates
 */
export function polarCWNorth({ center, angle, radius = 1 }) {
  const rad = toRadians(90 - angle);
  return [
    center[0] + radius * Math.cos(rad),
    center[1] + radius * Math.sin(rad),
  ];
}

export const polar = polarCCW;

/**
 * @file Coloring-related utility functions and variables.
 */

/**
 * Helper function that makes a css string from a color object.
 *
 * @param {Object} color the color to be converted
 * @return {string} the string representation of the color
 */
export const colorToString = color => {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
}

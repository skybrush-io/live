/**
 * @file Coloring-related utility functions and variables.
 */

import createColor from 'color';

/**
 * Helper function that makes a css string from a color object.
 *
 * @param {Object} color the color to be converted
 * @return {string} the string representation of the color
 */
export const colorToString = (color) => {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
};

/**
 * Attempts to parse the given object as a color using the Color package,
 * returning the given default color if the parsing fails.
 *
 * @param {Object} color the color to parse
 * @param {Object} defaultColor the default color to return when the parsing
 *        fails.
 * @return {Color} the parsed color
 * @throws Error if neither the color nor the given default color can be parsed
 *         with the Color constructor.
 */
export const parseColor = (color, defaultColor) => {
  try {
    return createColor(color);
  } catch {
    return createColor(defaultColor);
  }
};

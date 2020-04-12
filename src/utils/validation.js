/**
 * @file Helper functions for form validation.
 *
 * Each of these functions take a value to validate and return undefined
 * if the value is valid, or a preferred error message if the value is
 * invalid.
 *
 * Adapted from {@link https://github.com/erikras/react-redux-universal-hot-example/blob/master/src/utils/validation.js | this file}.
 */

const isEmpty = (value) =>
  value === undefined || value === null || value === '';
const join = (rules) => (value, data) =>
  rules.map((rule) => rule(value, data)).filter((error) => Boolean(error))[0];

/**
 * Checks that the given value is not empty. A value is empty if it is
 * undefined, null or an empty string.
 *
 * @param {Object} value  the value to validate
 * @return {?string} undefined if the value passes the validator, an error
 *     message otherwise
 */
export function required(value) {
  if (isEmpty(value)) {
    return 'Value is required';
  }
}

/**
 * Checks that the given value is an integer (or can be parsed as an
 * integer).
 *
 * @param {Object} value  the value to validate
 * @return {?string} undefined if the value passes the validator, an error message
 * otherwise
 */
export function integer(value) {
  if (!Number.isInteger(Number(value))) {
    return 'Value must be an integer';
  }
}

/**
 * Checks that the given value is a number (or can be parsed as a number).
 * Infinities are accepted; NaN is not.
 *
 * Typically, you need {@link finite} instead. Use this function only if
 * infinity is considered valid.
 *
 * @param {Object} value  the value to validate
 * @return {?string} undefined if the value passes the validator, an error message
 * otherwise
 */
export function number(value) {
  if (!Number(value)) {
    return 'Value must be a number or infinity';
  }
}

/**
 * Checks that the given value is a finite number (or can be parsed as a
 * finite number).
 *
 * @param {Object} value  the value to validate
 * @return {?string} undefined if the value passes the validator, an error message
 * otherwise
 */
export function finite(value) {
  if (!Number.isFinite(Number(value))) {
    return 'Value must be a number';
  }
}

/**
 * Function that returns a validator function that checks whether the given
 * value is greater than or equal to the given minimum value.
 *
 * Should be used in conjunction with {@link integer}, {@link number} or
 * {@link finite} to ensure that the returned validator function is given a
 * value that can actually be parsed as a number.
 *
 * @param {number} min  the minimum value that the generated validator
 *        will accept
 * @return {function} a validator function
 */
export function atLeast(min) {
  return (value) => {
    if (Number(value) < min) {
      return `Minimum allowed value is ${min}`;
    }
  };
}

/**
 * Function that returns a validator function that checks whether the given
 * value is less than or equal to the given maximum value.
 *
 * Should be used in conjunction with {@link integer}, {@link number} or
 * {@link finite} to ensure that the returned validator function is given a
 * value that can actually be parsed as a number.
 *
 * @param {number} max  the maximum value that the generated validator
 *        will accept
 * @return {function} a validator function
 */
export function atMost(max) {
  return (value) => {
    if (Number(value) > max) {
      return `Maximum allowed value is ${max}`;
    }
  };
}

/**
 * Function that returns a validator function that checks whether the given
 * value is between a minimum and a maximum value (both inclusive).
 *
 * Should be used in conjunction with {@link integer}, {@link number} or
 * {@link finite} to ensure that the returned validator function is given a
 * value that can actually be parsed as a number.
 *
 * @param {number} min  the minimum value that the generated validator
 *        will accept
 * @param {number} max  the maximum value that the generated validator
 *        will accept
 * @return {function} a validator function
 */
export function between(min, max) {
  if (min > max) {
    [min, max] = [max, min];
  }

  return (value) => {
    if (Number(value) < min || Number(value) > max) {
      return `Value must be between ${min} and ${max}`;
    }
  };
}

/**
 * Creates a validator function for a form from a set of rules for some
 * (or all) of the form fields.
 *
 * @param {Object} rules an object mapping field identifiers to validator
 *        functions or arrays of validator functions
 * @return {function} an appropriate validator function for the form
 */
export function createValidator(rules) {
  return (data = {}) => {
    const errors = {};
    Object.keys(rules).forEach((key) => {
      // Concat enables both functions and arrays of functions
      const rule = join([].concat(rules[key]));
      const error = rule(data[key], data);
      if (error) {
        errors[key] = error;
      }
    });
    return errors;
  };
}

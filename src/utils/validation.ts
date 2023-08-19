/**
 * @file Helper functions for form validation.
 *
 * Each of these functions take a value to validate and return undefined
 * if the value is valid, or a preferred error message if the value is
 * invalid.
 *
 * Adapted from {@link https://github.com/erikras/react-redux-universal-hot-example/blob/master/src/utils/validation.js | this file}.
 */

type Value = string | undefined;
type Error = string | undefined;
type Rule = (value: Value) => Error;

const isEmpty = (value: Value): boolean => value === undefined || value === '';

/**
 * Checks that the given value is not empty.
 * A value is empty if it is undefined or an empty string.
 *
 * @param value - The value to validate
 * @returns Undefined if the value passes the validator,
 *         an error message otherwise
 */
export const required: Rule = (value: Value) => {
  if (isEmpty(value)) {
    return 'Value is required';
  }
};

/**
 * Checks that the given value is a number (or can be parsed as a number).
 * Infinities are accepted; NaN is not.
 *
 * Typically, you need {@link finite} instead.
 * Use this function only if infinity is considered valid.
 *
 * @param value - The value to validate
 * @returns Undefined if the value passes the validator,
 *          an error message otherwise
 */
export const number: Rule = (value) => {
  if (!Number(value)) {
    return 'Value must be a number or infinity';
  }
};

/**
 * Checks that the given value is a finite number (or can be parsed as a
 * finite number).
 *
 * @param value - The value to validate
 * @returns Undefined if the value passes the validator,
 *          an error message otherwise
 */
export const finite: Rule = (value: Value) => {
  if (!Number.isFinite(Number(value))) {
    return 'Value must be a number';
  }
};

/**
 * Checks that the given value is an integer (or can be parsed as an integer).
 *
 * @param value - The value to validate
 * @returns Undefined if the value passes the validator,
 *          an error message otherwise
 */
export const integer: Rule = (value: Value) => {
  if (!Number.isInteger(Number(value))) {
    return 'Value must be an integer';
  }
};

/**
 * Checks that the given value is positive.
 *
 * @param value - The value to validate
 * @returns Undefined if the value passes the validator,
 *          an error message otherwise
 */
export const positive: Rule = (value: Value) => {
  if (Math.sign(Number(value)) !== 1) {
    return 'Value must be positive';
  }
};

/**
 * Function that returns a validator function that checks whether the given
 * value is greater than or equal to the given minimum value.
 *
 * Should be used in conjunction with {@link integer}, {@link number} or
 * {@link finite} to ensure that the returned validator function is given a
 * value that can actually be parsed as a number.
 *
 * @param min - The minimum value that the generated validator will accept
 * @returns A validator function
 */
export function atLeast(min: number): Rule {
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
 * @param max - The maximum value that the generated validator will accept
 * @returns A validator function
 */
export function atMost(max: number): Rule {
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
 * @param min - The minimum value that the generated validator will accept
 * @param max - The maximum value that the generated validator will accept
 * @returns A validator function
 */
export function between(min: number, max: number): Rule {
  if (min > max) {
    [min, max] = [max, min];
  }

  return (value) => {
    if (Number(value) < min || Number(value) > max) {
      return `Value must be between ${min} and ${max}`;
    }
  };
}

export function join(rules: Rule[]): Rule {
  return (value: Value) => rules.map((rule) => rule(value)).find(Boolean);
}

/**
 * Creates a validator function for a form from a set of rules for some
 * (or all) of the form fields.
 *
 * @param rules - An object mapping field identifiers to validator functions
 *                or arrays of validator functions
 * @returns An appropriate validator function for the form
 */
export function createValidator<T>(rules: Record<keyof T, Rule>) {
  return (data: Record<keyof T, Value>): Partial<Record<keyof T, Error>> => {
    const errors: Partial<Record<keyof T, Error>> = {};

    for (const key of Object.keys(rules) as Array<keyof T>) {
      // Enable both functions and arrays of functions
      const rule = join([rules[key]].flat());
      const error = rule(data[key]);
      if (error) {
        errors[key] = error;
      }
    }

    return errors;
  };
}

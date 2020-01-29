/**
 * @file Functions related to the handling of Flockwave error codes.
 */

export const Severity = Object.freeze({
  INFO: 0,
  WARNING: 1,
  ERROR: 2,
  FATAL: 3
});

/**
 * Returns the severity class of a Flockwave error code.
 */
export const getSeverityOfErrorCode = code => (code & 0xff) >> 6;

/**
 * Returns the severity class of the most severe error code from a list of
 * Flockwave error codes.
 */
export const getSeverityOfMostSevereErrorCode = codes =>
  codes && codes.length > 0
    ? Math.max(...codes.map(getSeverityOfErrorCode))
    : Severity.INFO;

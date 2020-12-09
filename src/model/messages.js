/**
 * @file Classes, functions and constants related to the representation of
 * messages sent to and received from a flock of UAVs.
 */

/**
 * Enum containing constants for the various messages types.
 */
export const MessageType = {
  OUTBOUND: 'outbound',
  INBOUND: 'inbound',
  ERROR: 'error',
};

/**
 * Enum containing log message severities from the Flockwave protocol.
 */
export const Severity = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

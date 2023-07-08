import { type ErrorCode } from '~/flockwave/errors';

/**
 * Returns whether the given Flockctrl status code used in the UAV model object
 * represents an error condition or a more severe condition (fatal error).
 */
export function isErrorCodeOrMoreSevere(code: ErrorCode): boolean {
  return (code & 0xff) >= 128;
}

/**
 * Returns whether the given Flockctrl status code used in the UAV model object
 * represents a warning condition or a more severe condition (error or fatal
 * error).
 */
export function isWarningCodeOrMoreSevere(code: ErrorCode): boolean {
  return (code & 0xff) >= 64;
}

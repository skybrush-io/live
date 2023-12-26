/**
 * @file Functions related to the handling of Flockwave error codes.
 */

import { Severity as ModelSeverity } from '~/model/enums';

/**
 * Error codes need to be numeric to support certain mathematical operations,
 * such as importance based sorting and determining severity.
 */
export type ErrorCode = number;

/**
 * Enum describing the supported error severity classes.
 */
export enum Severity {
  INFO = 0,
  WARNING = 1,
  ERROR = 2,
  FATAL = 3,
}

/**
 * Returns the severity class of a Flockwave error code.
 */
export const getSeverityOfErrorCode = (code: ErrorCode): Severity =>
  (code & 0xff) >> 6;

/**
 * Returns the severity class of the most severe error code from a list of
 * Flockwave error codes.
 */
export const getSeverityOfMostSevereErrorCode = (
  codes: ErrorCode[]
): Severity =>
  codes && codes.length > 0
    ? Math.max(...codes.map(getSeverityOfErrorCode))
    : Severity.INFO;

const semanticsForSeverities: Record<Severity, ModelSeverity> = {
  [Severity.FATAL]: ModelSeverity.CRITICAL,
  [Severity.ERROR]: ModelSeverity.ERROR,
  [Severity.WARNING]: ModelSeverity.WARNING,
  [Severity.INFO]: ModelSeverity.INFO,
};

export function errorSeverityToSemantics(severity: Severity): ModelSeverity {
  return semanticsForSeverities[severity];
}

export function errorCodeToSemantics(code: ErrorCode): ModelSeverity {
  return errorSeverityToSemantics(getSeverityOfErrorCode(code));
}

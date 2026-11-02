const logMessageCodes = [
  // Server reached its limit on the number of UAVs it can manage.
  'uavs.limit_reached',
] as const;

/**
 * Machine-readable codes for log messages.
 */
export type LogMessageCode = (typeof logMessageCodes)[number];

/**
 * Returns whether the given value is a recognized log message code.
 */
export const isLogMessageCode = (value: unknown): value is LogMessageCode =>
  logMessageCodes.some((code) => code === value);

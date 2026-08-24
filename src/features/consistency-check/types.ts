/**
 * Record that maps parameter names to a value -> UAV ID list mapping.
 *
 * Example: `{ param1: { value1: ['uav1', 'uav2'], value2: ['uav3'] } }`.
 */
export type ParameterMap = Record<string, Record<string, string[]>>;

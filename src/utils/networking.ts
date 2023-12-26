import { isLoopback } from 'ip';

/**
 * Returns whether the given hostname or IP address refers to the local host.
 *
 * @param hostname - The hostname to test
 * @returns Whether the given hostname or IP address refers to the local host
 */
export function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || isLoopback(hostname);
}

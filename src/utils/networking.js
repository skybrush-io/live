import { isLoopback } from 'ip';

/**
 * Returns whether the given hostname or IP address refers to the local host.
 *
 * @param {string}  hostname  the hostname to test
 * @return {boolean}  whether the given hostname or IP address refers to the
 *     local host
 */
export function isLocalHost(hostname) {
  return hostname === 'localhost' || isLoopback(hostname);
}

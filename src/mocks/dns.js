/**
 * Mock implementation for the 'dns' module in browser environments.
 *
 * Not complete; we only mock what we actually use.
 */

import { noop } from 'lodash'

export const reverse = noop

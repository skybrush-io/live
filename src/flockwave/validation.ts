/**
 * Common functions related to validation tasks in incoming and outgoing
 * messages.
 */

import type {
  CollectiveRTHPlanResult,
  CollectiveRTHPlanStatisticsEntry,
} from '@skybrush/flockwave-spec';
import { isRecord } from '~/utils/types';

/**
 * Checks whether the given object is the name of a valid extension on a
 * Flockwave server.
 *
 * Raises an exception if the given name is not a valid extension name.
 */
export function validateExtensionName(name: string): void {
  if (typeof name !== 'string' || name.includes('.')) {
    throw new Error(`Invalid extension name: ${name}`);
  }
}

/**
 * Checks whether the given string can be a valid object ID on a
 * Flockwave server.
 *
 * Raises an exception if the given name is not a valid object ID.
 */
export function validateObjectId(name: string): void {
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error(`Invalid object ID: ${name}`);
  }
}

/**
 * Checks whether the given object is a statistics entry of a collective RTH
 * plan in a show.
 *
 * Raises an exception if the object is not a valid statistics entry.
 */
export function validateCollectiveRTHPlanStatisticsEntry(
  stat: unknown
): asserts stat is CollectiveRTHPlanStatisticsEntry {
  if (!isRecord(stat)) {
    throw new TypeError(
      'Invalid stat in response to collective RTH transformation.'
    );
  }

  if (!('time' in stat) || typeof stat.time !== 'number') {
    throw new TypeError(
      'Invalid time in stat in response to collective RTH transformation.'
    );
  }

  if (!('duration' in stat) || typeof stat.duration !== 'number') {
    throw new TypeError(
      'Invalid duration in stat in response to collective RTH transformation.'
    );
  }

  if (!('showDuration' in stat) || typeof stat.showDuration !== 'number') {
    throw new TypeError(
      'Invalid showDuration in stat in response to collective RTH transformation.'
    );
  }
}

/**
 * Checks whether the given object is a valid response of a collective RTH
 * plan transformation.
 *
 * Raises an exception if the object is not a valid response.
 */
export function validateCollectiveRTHPlanResult(
  resp: unknown
): asserts resp is CollectiveRTHPlanResult {
  if (!isRecord(resp)) {
    throw new TypeError('Invalid response from collective RTH transformation.');
  }

  if (!('show' in resp) || typeof resp.show !== 'string') {
    throw new TypeError(
      'Invalid show response from collective RTH transformation.'
    );
  }

  if (!('showDuration' in resp) || typeof resp.showDuration !== 'number') {
    throw new TypeError(
      'Invalid showDuration response from collective RTH transformation.'
    );
  }

  if (!('stats' in resp) || !Array.isArray(resp.stats)) {
    throw new TypeError(
      'Invalid stats response from collective RTH transformation.'
    );
  }

  if (resp.stats.length === 0) {
    throw new TypeError(
      'No stats returned from collective RTH transformation.'
    );
  }

  if (
    'minRTHAltitude' in resp &&
    resp.minRTHAltitude !== null &&
    typeof resp.minRTHAltitude !== 'number'
  ) {
    throw new TypeError(
      'Invalid minRTHAltitude response from collective RTH transformation.'
    );
  }

  resp.stats.forEach(validateCollectiveRTHPlanStatisticsEntry);
}

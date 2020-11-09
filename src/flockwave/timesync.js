import delay from 'delay';
import isNil from 'lodash-es/isNil';
import sortBy from 'lodash-es/sortBy';
import sumBy from 'lodash-es/sumBy';

import { MAX_ROUNDTRIP_TIME } from '~/features/servers/constants';

/**
 * Estimates the clock skew between the local computer and the remote server
 * and the round-trip time of the connection by sending a SYS-TIME message
 * over the given message hub.
 *
 * @param {object} messageHub  the message hub that will send the SYS-TIME message
 * @param {string} method  the estimation method to use; "single" uses a single
 *        measurement only
 * @return {Promise} a promose that resolves to an object with two keys:
 *         `clockSkew` and `roundTripTime`, both of them are represented as
 *         milliseconds. The clock skew will be positive if the server is
 *         "ahead" of us and negative if it is "behind" us.
 */
export async function estimateClockSkewAndRoundTripTime(
  messageHub,
  options = {}
) {
  const { method = 'single' } = options;

  if (method === 'threshold') {
    // "Threshold" method -- run the algorithm at most five times or until we
    // get a roundtrip time less than a given threshold, whichever happens
    // first. Return the smallest RTT and the corresponding clock skew.
    let bestResult;
    let nextResult;
    let numberOfTriesLeft = 5;

    const attempt = () =>
      estimateClockSkewAndRoundTripTime(messageHub, { method: 'single' });
    bestResult = await attempt();
    while (
      numberOfTriesLeft > 0 &&
      bestResult.roundTripTime > MAX_ROUNDTRIP_TIME
    ) {
      numberOfTriesLeft--;
      // eslint-disable-next-line no-await-in-loop
      nextResult = await attempt();
      if (nextResult.roundTripTime < bestResult.roundTripTime) {
        bestResult = nextResult;
      }
    }

    return bestResult;
  }

  if (method === 'accurate') {
    // Accurate method -- run the algorithm 10 times, throw away the two highest
    // round-trip times (outliers), and take the reported RTT to be the average
    // of the rest. For the clock skew, take the three attempts with the lowest
    // RTT, calculate the corresponding clock skews and then take the average.
    let tries = 10;
    const results = [];
    const attempt = () =>
      estimateClockSkewAndRoundTripTime(messageHub, { method: 'single' });

    while (tries > 0) {
      const startedAt = performance.now();

      tries--;

      try {
        // eslint-disable-next-line no-await-in-loop
        const result = await attempt();
        if (
          result &&
          !isNil(result.clockSkew) &&
          !isNil(result.roundTripTime)
        ) {
          results.push(result);
        }
      } catch {
        // Ignored intentionally.
      }

      const elapsed = performance.now() - startedAt;
      const toWait = Math.max(500 - elapsed, 0);
      if (tries > 0 && toWait > 0) {
        // eslint-disable-next-line no-await-in-loop
        await delay(toWait);
      }
    }

    const sortedResults = sortBy(results, 'roundTripTime');
    if (sortedResults.length === 0) {
      throw new Error('Failed to calculate clock skew and round-trip time');
    }

    // Throw away the outliers
    if (sortedResults.length > 5) {
      sortedResults.splice(-2, 2);
    } else if (sortedResults.length > 3) {
      sortedResults.splice(-1, 1);
    }

    // Average the RTT
    const roundTripTime =
      sumBy(sortedResults, 'roundTripTime') / sortedResults.length;

    // Calculate the clock skew from the lowest 3 RTTs
    const clockSkew =
      sumBy(sortedResults.slice(0, 3), 'clockSkew') /
      Math.min(sortedResults.length, 3);

    return {
      roundTripTime,
      clockSkew,
    };
  }

  // This is basically Cristian's algorithm below
  const sentAt = performance.now();
  const response = await messageHub.sendMessage('SYS-TIME');
  const receivedAt = performance.now();
  const localClockAtArrival = Date.now();
  const roundTripTime = receivedAt - sentAt;

  // Get the timestamp from the message; this is what was on the clock of the
  // server when it processed our message
  const serverClock =
    response.body.timestamp && typeof response.body.timestamp === 'number'
      ? response.body.timestamp
      : null;

  // Add half the round-trip time to the server timestamp to get the most likely
  // value of the server clock _now_, assuming that the request and the response
  // travelled roughly the same amount of time.
  const serverClockAtArrival = isNil(serverClock)
    ? null
    : serverClock + roundTripTime / 2;
  const clockSkew = isNil(serverClockAtArrival)
    ? null
    : serverClockAtArrival - localClockAtArrival;

  return { clockSkew, roundTripTime };
}

/**
 * Sends a message to the server that will adjust its clock by the currently
 * calculated clock skew to match the local time.
 */
export async function adjustServerTimeToMatchLocalTime(messageHub, clockSkew) {
  let response;

  try {
    response = await messageHub.sendMessage({
      type: 'SYS-TIME',
      adjustment: -clockSkew,
    });
  } catch {
    response = undefined;
  }

  const { body } = response || {};

  if (!body || body.type !== 'SYS-TIME') {
    throw new Error(
      body && body.type === 'ACK-NAK' && response.reason
        ? `Failed to adjust server time: ${response.reason}`
        : 'Failed to adjust server time'
    );
  }
}

import isNil from 'lodash-es/isNil';

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

  // This is basically Cristian's algorithm below
  const sentAt = window.performance.now();
  const response = await messageHub.sendMessage('SYS-TIME');
  const receivedAt = window.performance.now();
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

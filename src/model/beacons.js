import isNil from 'lodash-es/isNil';
import isUndefined from 'lodash-es/isUndefined';
import mapValues from 'lodash-es/mapValues';
import omitBy from 'lodash-es/omitBy';

import { setBeaconStateMultiple } from '~/features/beacons/slice';

export const mapPosition = (positionFromServer) =>
  positionFromServer &&
  Array.isArray(positionFromServer) &&
  (positionFromServer[0] !== 0 || positionFromServer[1] !== 0)
    ? {
        lat: positionFromServer[0] / 1e7,
        lon: positionFromServer[1] / 1e7,
        amsl: isNil(positionFromServer[2]) ? null : positionFromServer[2] / 1e3,
        ahl: isNil(positionFromServer[3]) ? null : positionFromServer[3] / 1e3,
        agl: isNil(positionFromServer[4]) ? null : positionFromServer[4] / 1e3,
      }
    : null;

export const mapHeading = (headingFromServer) =>
  headingFromServer && typeof headingFromServer === 'number'
    ? headingFromServer / 10
    : null;

/**
 * Handles a BCN-INF message from a Skybrush server and updates the
 * state of the Redux store appropriately.
 *
 * @param  {Object} body  the body of the DOCK-INF message
 * @param  {function} dispatch  the dispatch function of the Redux store
 */
export function handleBeaconInformationMessage(body, dispatch) {
  // Map the status objects from the server into the format expected
  // by our Redux actions. Omit keys for which the values are not
  // provided by the server.

  const states = mapValues(body.status, ({ id, active, heading, position }) =>
    omitBy(
      {
        id,
        position: mapPosition(position),
        heading: mapHeading(heading),
        active,
      },
      isUndefined
    )
  );

  dispatch(setBeaconStateMultiple(states));
}

/**
 * Handles a BCN-PROPS message from a Skybrush server and updates the
 * state of the Redux store appropriately.
 *
 * @param  {Object} body  the body of the DOCK-INF message
 * @param  {function} dispatch  the dispatch function of the Redux store
 */
export function handleBeaconPropertiesMessage(body, dispatch) {
  // Map the status objects from the server into the format expected
  // by our Redux actions. Omit keys for which the values are not
  // provided by the server.

  const states = mapValues(body.result, ({ id, name }) =>
    omitBy(
      {
        id,
        name,
      },
      isUndefined
    )
  );

  dispatch(setBeaconStateMultiple(states));
}

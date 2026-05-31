import isNil from 'lodash-es/isNil';
import isUndefined from 'lodash-es/isUndefined';
import mapValues from 'lodash-es/mapValues';
import omitBy from 'lodash-es/omitBy';

import type { AppDispatch } from '~/store/reducers';

import type {
  GPSCoordinate,
  Response_BCNINF,
  Response_BCNPROPS,
} from '@skybrush/flockwave-spec';
import { setBeaconStateMultiple } from '~/features/beacons/slice';
import type { Beacon } from '~/features/beacons/types';
import type { Latitude, Longitude } from '~/utils/geography';

import type { GPSPosition } from './geography';

export const mapPosition = (
  positionFromServer: GPSCoordinate | null | undefined
): GPSPosition | null =>
  positionFromServer &&
  Array.isArray(positionFromServer) &&
  (positionFromServer[0] !== 0 || positionFromServer[1] !== 0)
    ? {
        lat: (positionFromServer[0] / 1e7) as Latitude,
        lon: (positionFromServer[1] / 1e7) as Longitude,
        amsl: isNil(positionFromServer[2])
          ? undefined
          : positionFromServer[2] / 1e3,
        ahl: isNil(positionFromServer[3])
          ? undefined
          : positionFromServer[3] / 1e3,
        agl: isNil(positionFromServer[4])
          ? undefined
          : positionFromServer[4] / 1e3,
      }
    : null;

export const mapHeading = (
  headingFromServer: number | null | undefined
): number | null =>
  headingFromServer && typeof headingFromServer === 'number'
    ? headingFromServer / 10
    : null;

/**
 * Handles a BCN-INF message from a Skybrush server and updates the
 * state of the Redux store appropriately.
 *
 * @param  body  the body of the BCN-INF message
 * @param  dispatch  the dispatch function of the Redux store
 */
export function handleBeaconInformationMessage(
  body: Response_BCNINF,
  dispatch: AppDispatch
): void {
  // Map the status objects from the server into the format expected
  // by our Redux actions. Omit keys for which the values are not
  // provided by the server.

  const states = mapValues(
    body.status,
    ({ id, active, heading, position }) =>
      omitBy(
        {
          id,
          position: mapPosition(position),
          heading: mapHeading(heading),
          active,
        },
        isUndefined
      ) as Omit<Beacon, 'id'>
  );

  dispatch(setBeaconStateMultiple(states));
}

/**
 * Handles a BCN-PROPS message from a Skybrush server and updates the
 * state of the Redux store appropriately.
 *
 * @param  body  the body of the BCN-PROPS message
 * @param  dispatch  the dispatch function of the Redux store
 */
export function handleBeaconPropertiesMessage(
  body: Response_BCNPROPS,
  dispatch: AppDispatch
): void {
  // Map the status objects from the server into the format expected
  // by our Redux actions. Omit keys for which the values are not
  // provided by the server.

  const states = mapValues(
    body.result,
    ({ id, name }) =>
      omitBy(
        {
          id,
          name,
        },
        isUndefined
      ) as Pick<Beacon, 'id' | 'name'>
  );

  dispatch(setBeaconStateMultiple(states));
}

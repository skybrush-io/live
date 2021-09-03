import addDays from 'date-fns/addDays';
import isAfter from 'date-fns/isAfter';
import { createSelector } from 'reselect';
import SunCalc from 'suncalc';

import { getMapViewCenterPosition } from '~/selectors/map';
import { createShallowSelector } from '~/utils/selectors';

const getRoundedMapViewCenterPosition = createSelector(
  getMapViewCenterPosition,
  (position) =>
    Array.isArray(position) && position.length >= 2
      ? [Number(position[0].toFixed(1)), Number(position[1].toFixed(1))]
      : null
);

export const getSunriseSunsetTimesForMapViewCenterPosition =
  createShallowSelector(getRoundedMapViewCenterPosition, (position) => {
    const now = new Date();
    const result = position
      ? SunCalc.getTimes(now, position[1], position[0])
      : {};

    // If we are past the sunrise, replace the sunrise times with the ones from
    // the next day
    if (position && result.sunriseEnd && isAfter(now, result.sunriseEnd)) {
      const nextDay = SunCalc.getTimes(
        addDays(now, 1),
        position[1],
        position[0]
      );
      result.sunrise = nextDay.sunrise;
      result.sunriseEnd = nextDay.sunriseEnd;
    }

    return result;
  });

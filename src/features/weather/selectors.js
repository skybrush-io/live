import addDays from 'date-fns/addDays';
import isAfter from 'date-fns/isAfter';
import { createSelector } from '@reduxjs/toolkit';
import SunCalc from 'suncalc';

import { Status } from '@skybrush/app-theme-material-ui';

import { getMapViewCenterPosition } from '~/selectors/map';
import { toDegrees } from '~/utils/math';
import { createShallowSelector } from '~/utils/selectors';

const getRoundedMapViewCenterPosition = createSelector(
  getMapViewCenterPosition,
  (position) =>
    Array.isArray(position) && position.length >= 2
      ? [Number(position[0].toFixed(2)), Number(position[1].toFixed(2))]
      : null
);

export const getSunriseSunsetTimesForMapViewCenterPosition =
  createShallowSelector(getRoundedMapViewCenterPosition, (position) => {
    const now = new Date();
    const result = position
      ? SunCalc.getTimes(now, position[1], position[0])
      : {};

    // Replace invalid dates with undefined
    for (const [key, date] of Object.entries(result)) {
      if (date instanceof Date && Number.isNaN(date.valueOf())) {
        result[key] = undefined;
      }
    }

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

export function getDeclinationFromMagneticVector(magneticVector) {
  if (!Array.isArray(magneticVector) || magneticVector.length !== 3) {
    return null;
  } else {
    return toDegrees(Math.atan2(magneticVector[1], magneticVector[0]));
  }
}

export function getStatusForKpIndex(kpIndex) {
  if (typeof kpIndex === 'number') {
    if (kpIndex >= 5) {
      return Status.ERROR;
    } else if (kpIndex >= 4) {
      return Status.WARNING;
    } else {
      return null;
    }
  }
}

export function isWeatherDataLoading(state) {
  return state.weather.loading;
}

export function getWeatherDataLastUpdateTimestamp(state) {
  return state.weather.lastUpdatedAt;
}

export function getWeatherBadgeStatus(state) {
  return getStatusForKpIndex(state.weather.data?.kpIndex);
}

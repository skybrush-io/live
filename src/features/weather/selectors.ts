import { createSelector } from '@reduxjs/toolkit';
import addDays from 'date-fns/addDays';
import isAfter from 'date-fns/isAfter';
import * as SunCalc from 'suncalc-ts';

import { Status } from '@skybrush/app-theme-mui';
import { type Degrees, toDegrees } from '@skybrush/math';

import { getMapViewCenterPosition } from '~/selectors/map';
import type { AppSelector, RootState } from '~/store/reducers';
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
    const result: { [P in keyof SunCalc.TimesData]?: Date | undefined } =
      position ? SunCalc.getTimes(now, position[1], position[0]) : {};

    // Replace invalid dates with undefined
    for (const [key, date] of Object.entries(result)) {
      if (date instanceof Date && Number.isNaN(date.valueOf())) {
        result[key as keyof SunCalc.TimesData] = undefined;
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

export function getDeclinationFromMagneticVector(
  magneticVector: number[]
): Degrees | null {
  if (!Array.isArray(magneticVector) || magneticVector.length !== 3) {
    return null;
  } else {
    return toDegrees(Math.atan2(magneticVector[1], magneticVector[0]));
  }
}

export function getStatusForKpIndex(
  kpIndex: number | null | undefined
): Status | null {
  if (typeof kpIndex === 'number') {
    if (kpIndex >= 5) {
      return Status.ERROR;
    } else if (kpIndex >= 4) {
      return Status.WARNING;
    } else {
      return null;
    }
  } else {
    return null;
  }
}

export const isWeatherDataLoading: AppSelector<boolean> = (state: RootState) =>
  state.weather.loading;

export const getWeatherDataLastUpdateTimestamp: AppSelector<
  number | undefined
> = (state: RootState) => state.weather.lastUpdatedAt;

export const getWeatherBadgeStatus: AppSelector<Status | null> = (
  state: RootState
) => getStatusForKpIndex(state.weather.data?.kpIndex);

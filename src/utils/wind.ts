import { toDegrees, toRadians } from '@skybrush/math';

import type { WindEstimate } from '~/model/wind';

export type WindSummary = {
  /** Number of UAVs that contributed a nonzero wind estimate */
  count: number;

  /** Speed of the average wind vector, in m/s */
  meanSpeed: number;

  /**
   * Direction the average wind vector blows from, in degrees in [0, 360).
   * Meaningless if `meanSpeed` is zero.
   */
  meanDirection: number;

  /** Highest individual wind speed, in m/s */
  maxSpeed: number;
};

/**
 * Summarizes wind estimates of multiple UAVs. Estimates with zero speed are
 * ignored. The mean is calculated on the wind vectors, not on the speeds and
 * directions separately.
 */
export const summarizeWindEstimates = (
  estimates: WindEstimate[]
): WindSummary => {
  let count = 0;
  let sumX = 0;
  let sumY = 0;
  let maxSpeed = 0;

  for (const { speed, direction } of estimates) {
    if (speed > 0) {
      const angle = toRadians(direction);
      sumX += speed * Math.sin(angle);
      sumY += speed * Math.cos(angle);
      maxSpeed = Math.max(maxSpeed, speed);
      count++;
    }
  }

  if (count === 0) {
    return { count, meanSpeed: 0, meanDirection: 0, maxSpeed };
  }

  return {
    count,
    meanSpeed: Math.hypot(sumX, sumY) / count,
    meanDirection: (toDegrees(Math.atan2(sumX, sumY)) + 360) % 360,
    maxSpeed,
  };
};

const COMPASS_DIRECTIONS = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'E',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSW',
  'SW',
  'WSW',
  'W',
  'WNW',
  'NW',
  'NNW',
] as const;

/**
 * Returns the 16-point compass direction (N, NNE, NE, ...) that corresponds
 * to the given direction in degrees.
 */
export const getCompassDirection = (degrees: number): string => {
  const sector = Math.round((((degrees % 360) + 360) % 360) / 22.5) % 16;
  return COMPASS_DIRECTIONS[sector];
};

import type { LonLat } from '~/utils/geography';
import type { Coordinate2D } from '~/utils/math';

import type { OriginType } from '../map/types';

export type CoordinateSystemFittingProblem = {
  uavIds: string[];
  uavGPSCoordinates: LonLat[];
  uavHeadings: Array<number | undefined>;
  takeoffCoordinates: Coordinate2D[];
};

export type CoordinateSystemEstimate = {
  origin: LonLat;
  orientation: number;
  type: OriginType;
};

import type { CoordinateSystemType, LonLat } from '~/utils/geography';

export type Origin = {
  position: LonLat;
  angle: string;
  type: CoordinateSystemType;
};

export type View = {
  position: LonLat;
  angle: string;
  zoom: number;
};

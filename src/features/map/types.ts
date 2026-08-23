import { type LonLat } from '~/utils/geography';

export enum CoordinateSystemType {
  NEU = 'neu',
  NWU = 'nwu',
}

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

import { type LonLat } from '~/utils/geography';

export type Origin = {
  position: LonLat;
  angle: string;
  type: OriginType;
};

export enum OriginType {
  NEU = 'neu',
  NWU = 'nwu',
}

export type View = {
  position: LonLat;
  angle: string;
  zoom: number;
};

import { type Coordinate2D } from '~/utils/math';

export type Origin = {
  position: Coordinate2D;
  angle: string;
  type: OriginType;
};

export enum OriginType {
  NEU = 'neu',
  NWU = 'nwu',
}

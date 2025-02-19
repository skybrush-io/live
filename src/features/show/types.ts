import type { Coordinate2D, Coordinate3D } from '~/utils/math';

import type {
  AltitudeReferenceSpecification,
  TakeoffHeadingSpecification,
} from './constants';
import { EnvironmentType } from './enums';

export type CoordinateSystem = {
  orientation: string; // stored as a string to avoid rounding errors
};

export type OutdoorCoordinateSystem = CoordinateSystem & {
  origin?: Coordinate2D;
  type: 'neu' | 'nwu';
};

export type OutdoorCoordinateSystemWithOrigin = OutdoorCoordinateSystem & {
  origin: Coordinate2D;
};

export const isOutdoorCoordinateSystemWithOrigin = (
  coordinateSystem: OutdoorCoordinateSystem
): coordinateSystem is OutdoorCoordinateSystemWithOrigin =>
  coordinateSystem.origin !== undefined;

export type OutdoorEnvironment = {
  coordinateSystem: OutdoorCoordinateSystem;
  altitudeReference: AltitudeReferenceSpecification;
  takeoffHeading: TakeoffHeadingSpecification;
};

export type IndoorEnvironment = {
  coordinateSystem: CoordinateSystem;
  room: {
    visible: false;
    firstCorner: Coordinate3D;
    secondCorner: Coordinate3D;
  };
  takeoffHeading: TakeoffHeadingSpecification;
};

export type EnvironmentState = {
  editing: boolean;
  outdoor: OutdoorEnvironment;
  indoor: IndoorEnvironment;
  type: EnvironmentType;
};

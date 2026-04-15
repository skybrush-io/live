import { type SetRequired } from 'type-fest';

import type { ShowSegment, ShowSegmentId } from '@skybrush/show-format';

import { type LonLat } from '~/utils/geography';
import type { Coordinate3D } from '~/utils/math';

import type {
  AltitudeReferenceSpecification,
  TakeoffHeadingSpecification,
} from './constants';
import { type EnvironmentType } from './enums';

export type CoordinateSystem = {
  orientation: string; // stored as a string to avoid rounding errors
};

export type OutdoorCoordinateSystem = CoordinateSystem & {
  origin?: LonLat;
  type: 'neu' | 'nwu';
};

export type OutdoorCoordinateSystemWithOrigin = SetRequired<
  OutdoorCoordinateSystem,
  'origin'
>;

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
  estimatingCoordinateSystem: boolean;
  outdoor: OutdoorEnvironment;
  indoor: IndoorEnvironment;
  type: EnvironmentType;
};

export type ShowSegmentsRecord = Partial<Record<ShowSegmentId, ShowSegment>>;

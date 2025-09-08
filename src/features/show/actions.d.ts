import type { AppThunk } from '~/store/reducers';
import type { Coordinate2D } from '~/utils/math';
import type { TakeoffHeadingSpecification } from './constants';

export const authorizeIfAndOnlyIfHasStartTime: () => AppThunk;
export const clearStartTime: () => AppThunk;
export const setOutdoorShowAltitudeReferenceToAverageAMSL: () => AppThunk;
export const updateOutdoorShowSettings: (payload: {
  origin?: Coordinate2D;
  orientation?: number | string;
  takeoffHeading?: TakeoffHeadingSpecification;
  setupMission?: boolean;
}) => AppThunk;

export const loadBase64EncodedShow: (base64Blob: string) => AppThunk;

import type { GPSPosition } from '~/model/geography';
import type { RootState } from '~/store/reducers';

import type { StoredUAV } from './types';

export function areAllUAVsInMissionWithoutErrors(state: RootState): boolean;
export function getActiveUAVIds(state: RootState): string[];
export function getAllValidUAVPositions(state: RootState): GPSPosition[];
export function getCurrentGPSPositionByUavId(
  state: RootState,
  uavId: string
): GPSPosition | undefined;
export function getCurrentHeadingByUavId(
  state: RootState,
  uavId: string
): number | undefined;
export function getMissingUAVIdsInMapping(state: RootState): string[];
export function getSelectedUAVIds(state: RootState): string[];
export function getSingleSelectedUAVIdAsArray(): string[];
export function getUAVIdList(state: RootState): string[];
export function getUAVIdsMarkedAsGone(state: RootState): string[];
export function getUAVIdToStateMapping(
  state: RootState
): Record<string, StoredUAV>;

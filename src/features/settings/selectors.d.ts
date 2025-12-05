import type { APIKeysRecord } from '~/APIKeys';
import type { RootState } from '~/store/reducers';
import type {
  UAVListLayout,
  UAVListOrientation,
  UAVSortKeyAndOrder,
} from './types';
import type { UAVFilter } from '~/model/filtering';

export function shouldOptimizeUIForTouch(state: any): boolean;
export function getAPIKeys(state: RootState): APIKeysRecord;
export function getDesiredPlacementAccuracyInMeters(state: RootState): number;
export function getDesiredTakeoffHeadingAccuracy(state: RootState): number;
export function getMaximumConcurrentUploadTaskCount(state: RootState): number;
export function getUAVListFilters(state: RootState): UAVFilter[];
export function getUAVListLayout(state: RootState): UAVListLayout;
export function getUAVListOrientation(state: RootState): UAVListOrientation;
export function getUAVListSortPreference(state: RootState): UAVSortKeyAndOrder;
export function isShowingEmptyMissionSlots(state: RootState): boolean;
export function isShowingMissionIds(state: RootState): boolean;
export function getMinimumIndoorTakeoffSpacing(state: RootState): number;
export function getMinimumOutdoorTakeoffSpacing(state: RootState): number;

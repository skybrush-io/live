import type { APIKeysRecord } from '~/APIKeys';
import type { RootState } from '~/store/reducers';

export function shouldOptimizeUIForTouch(state: any): boolean;
export function getAPIKeys(state: RootState): APIKeysRecord;
export function getMaximumConcurrentUploadTaskCount(state: RootState): number;

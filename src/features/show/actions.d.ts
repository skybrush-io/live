import type { AppThunk } from '~/store/reducers';

export const authorizeIfAndOnlyIfHasStartTime: () => AppThunk;
export const clearStartTime: () => AppThunk;

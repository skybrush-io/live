import { getBase64ShowBlob } from '~/features/show/selectors';
import messageHub from '~/message-hub';
import type { AppThunk } from '~/store/reducers';
import { writeBlobToFile } from '~/utils/filesystem';

import { selectTransformedShowBlob } from './selectors';
import { setResult } from './state';

export type EmergencyRTHConfig = {
  minDistance?: number;
  preferredDistance?: number;
  timeResolution?: number;
};

export const addEmergencyRTH =
  (config?: EmergencyRTHConfig): AppThunk =>
  async (dispatch, getState): Promise<void> => {
    const state = getState();
    const base64ShowBlob = getBase64ShowBlob(state);
    dispatch(setResult({ loading: true }));

    const serverConfig = {
      min_distance: config?.minDistance,
      preferred_distance: config?.preferredDistance,
      time_resolution: config?.timeResolution,
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { show } =
        // @ts-expect-error: ts(2339)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await messageHub.query.addEmergencyRTH(base64ShowBlob, serverConfig);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      dispatch(setResult({ show }));
    } catch (error) {
      console.warn('addEmergencyRTH failed with error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Unknown error type.';
      dispatch(setResult({ error: errorMessage }));
    }
  };

export const saveTransformedShow =
  (): AppThunk => async (_dispatch, getState) => {
    const adaptedBase64Show = selectTransformedShowBlob(getState());
    if (adaptedBase64Show) {
      await writeBlobToFile(adaptedBase64Show, 'adapted-show.skyc');
    }
  };

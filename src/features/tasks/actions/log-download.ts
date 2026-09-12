import { errorToString } from '~/error-handling';
import { showNotification } from '~/features/snackbar/actions';
import { MessageSemantics } from '~/features/snackbar/types';
import type { ProgressStatus } from '~/flockwave/messages';
import messageHub from '~/message-hub';
import type { FlightLog } from '~/model/flight-logs';
import { convertFlightLogToBlob } from '~/model/flight-logs';
import type { AppThunk } from '~/store/reducers';
import { writeBlobToFile } from '~/utils/filesystem';

import { writeTaskPayload } from '../payload-store';
import { _completeTask, _failTask, _setTaskProgress } from '../slice';
import type { LogDownloadTaskSpec, StartOptions } from '../types';
import { getTaskKey } from '../utils';

const saveLogToFile = (log: FlightLog) => {
  const { filename, blob } = convertFlightLogToBlob(log);
  void writeBlobToFile(blob, filename);
};

export const runLogDownloadTask =
  (
    spec: LogDownloadTaskSpec,
    { retry }: { retry: () => void },
    { silent = false }: StartOptions = {}
  ): AppThunk<Promise<void>> =>
  async (dispatch) => {
    const { uavId, params } = spec;
    const { logId } = params;
    const key = getTaskKey(spec);

    const onProgress = ({ progress }: ProgressStatus) => {
      dispatch(_setTaskProgress({ key, progress }));
    };

    try {
      const log = await messageHub.query.getFlightLog(uavId, logId, {
        onProgress,
      });
      const hash = writeTaskPayload(log);
      dispatch(_completeTask({ key, result: { hash } }));
      if (!silent) {
        showNotification({
          message: `Log ${logId} of UAV ${uavId} downloaded successfully.`,
          semantics: MessageSemantics.SUCCESS,
          buttons: [
            {
              label: 'Save',
              action: () => saveLogToFile(log),
            },
          ],
          timeout: 20000,
          topic: key,
        });
      }
    } catch (error: unknown) {
      const errorMessage = errorToString(error);
      dispatch(_failTask({ key, error: errorMessage }));
      if (!silent) {
        showNotification({
          message: `Couldn't download log ${logId} of UAV ${uavId}: ${errorMessage}`,
          semantics: MessageSemantics.ERROR,
          buttons: [{ label: 'Retry', action: retry }],
          timeout: 20000,
          topic: key,
        });
      }
    }
  };

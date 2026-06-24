import { errorToString } from '~/error-handling';
import { showNotification } from '~/features/snackbar/actions';
import { MessageSemantics } from '~/features/snackbar/types';
import type { ProgressStatus } from '~/flockwave/messages';
import messageHub from '~/message-hub';
import type { FlightLog } from '~/model/flight-logs';
import { convertFlightLogToBlob } from '~/model/flight-logs';
import type { AppThunk } from '~/store/reducers';
import { writeBlobToFile } from '~/utils/filesystem';

import { _completeTask, _failTask, _setTaskProgress } from '../slice';
import type { LogDownloadTaskSpec, StartOptions } from '../types';
import { getTaskKey } from '../utils';

const logContents = new (class {
  #data: Record<string, FlightLog> = {};
  #encoder = new TextEncoder();

  write = async (item: FlightLog): Promise<string> => {
    const payload = JSON.stringify(item);
    // prettier-ignore
    const hash = (
      Array.from(
        new Uint8Array(
          await window.crypto.subtle.digest(
            'SHA-1',
            this.#encoder.encode(payload)
          )
        ),
        (byte) => byte.toString(16).padStart(2, '0')
      ).join('')
    );
    this.#data[hash] = item;
    return hash;
  };

  read = (hash: string): FlightLog | undefined => this.#data[hash];
})();

export const readDownloadedLog = (hash: string): FlightLog | undefined =>
  logContents.read(hash);

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
    const { uavId, type, taskId, params } = spec;
    const { logId } = params;
    const topic = getTaskKey(spec);

    const onProgress = ({ progress }: ProgressStatus) => {
      dispatch(_setTaskProgress({ uavId, type, taskId, progress }));
    };

    try {
      const log = await messageHub.query.getFlightLog(uavId, logId, {
        onProgress,
      });
      const hash = await logContents.write(log);
      dispatch(_completeTask({ uavId, type, taskId, result: { hash } }));
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
          topic,
        });
      }
    } catch (error: unknown) {
      const errorMessage = errorToString(error);
      dispatch(_failTask({ uavId, type, taskId, error: errorMessage }));
      if (!silent) {
        showNotification({
          message: `Couldn't download log ${logId} of UAV ${uavId}: ${errorMessage}`,
          semantics: MessageSemantics.ERROR,
          buttons: [{ label: 'Retry', action: retry }],
          timeout: 20000,
          topic,
        });
      }
    }
  };

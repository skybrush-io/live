/**
 * Main entry point for workers used by the application.
 */

import { Transfer } from 'workerpool';
import type { LoadShowOptions } from './functions/load-show';
import { pool } from './pool';
import type { WorkerApi } from './types';

const workers: WorkerApi = {
  estimateShowCoordinateSystem: (...args) =>
    pool.exec('estimateShowCoordinateSystem', args),
  loadShow: (
    file: string | number[] | Uint8Array,
    options: LoadShowOptions = {}
  ) => {
    let fileOrTransfer;
    if (file instanceof Uint8Array) {
      fileOrTransfer = new Transfer(file, [file.buffer]);
    } else {
      fileOrTransfer = file;
    }
    return pool.exec('loadShow', [fileOrTransfer, options]);
  },
};

export default workers;

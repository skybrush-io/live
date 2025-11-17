/**
 * Main entry point for workers used by the application.
 */

import type { LoadShowOptions } from './functions/load-show';
import { pool } from './pool';
import type { WorkerApi } from './types';

const workers: WorkerApi = {
  estimateShowCoordinateSystem: (...args) =>
    pool.exec('estimateShowCoordinateSystem', args),
  findGreedyAssignment: (...args) => pool.exec('findGreedyAssignment', args),
  loadShow: (
    file: string | number[] | Uint8Array | File,
    options: LoadShowOptions = {}
  ) => {
    const params: any[] = [file, options];
    let execOptions: Record<string, any> | undefined;
    if (file instanceof Uint8Array) {
      execOptions = { transfer: [file.buffer] };
    }

    return pool.exec('loadShow', params, execOptions);
  },
};

export default workers;

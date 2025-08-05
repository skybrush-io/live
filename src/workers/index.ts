/**
 * Main entry point for workers used by the application.
 */

import { pool } from './pool';
import type { WorkerApi } from './types';

const workers: WorkerApi = {
  fibonacci: (...args) => pool.exec('fibonacci', args),
  loadShow: async (...args) => {
    const { spec, ...rest } = await pool.exec('loadShow', args);
    // Pre-freeze the show data shallowly to give a hint to Redux Toolkit that
    // the show content won't change
    return { spec: Object.freeze(spec), ...rest };
  },
};

export default workers;

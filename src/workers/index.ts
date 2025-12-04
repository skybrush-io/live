/**
 * Main entry point for workers used by the application.
 */

import { pool } from './pool';
import type { WorkerApi } from './types';

const workers: WorkerApi = {
  estimateShowCoordinateSystem: (...args) =>
    pool.exec('estimateShowCoordinateSystem', args),
  fibonacci: (...args) => pool.exec('fibonacci', args),
  loadShow: (...args) => pool.exec('loadShow', args),
};

export default workers;

/**
 * Main entry point for workers used by the application.
 */

import { pool } from './pool';
import type { WorkerApi } from './types';

const workers: WorkerApi = {
  fibonacci: (...args) => pool.exec('fibonacci', args),
};

export default workers;

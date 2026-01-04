/**
 * Worker pool used by the application to run CPU-intensive tasks in the
 * background.
 */

import workerPool from 'workerpool';
import { WorkerUrl } from 'worker-url';

// Webpack integration requires us to jump through some hoops to get the correct path.
// This is because 'workerpool' expects a path to the worker file, but Webpack
// bundles the worker code into a single file and provides no access to the URL
// of the worker file directly.
//
// See here: https://github.com/josdejong/workerpool/blob/HEAD/examples%2Fwebpack5%2FREADME.md

const url = new WorkerUrl(new URL('./worker.ts', import.meta.url));
export const pool = workerPool.pool(url.toString(), {
  maxWorkers: 8,
});

export default pool;

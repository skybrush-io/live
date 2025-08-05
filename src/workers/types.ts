import type { Asyncify } from 'type-fest';

import type fibonacci from './functions/fibonacci';

/**
 * Type specification for the API of functions exposed by the worker module.
 */
export type WorkerApi = {
  fibonacci: Asyncify<typeof fibonacci>;
};

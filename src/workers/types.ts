import type { Asyncify } from 'type-fest';

import type estimateShowCoordinateSystem from './functions/estimate-coords';
import type fibonacci from './functions/fibonacci';
import type loadShow from './functions/load-show';

/**
 * Type specification for the API of functions exposed by the worker module.
 */
export type WorkerApi = {
  estimateShowCoordinateSystem: Asyncify<typeof estimateShowCoordinateSystem>;
  fibonacci: Asyncify<typeof fibonacci>;
  loadShow: Asyncify<typeof loadShow>;
};

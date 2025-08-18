import type { SetReturnType } from 'type-fest';
import type { Promise } from 'workerpool';

import type estimateShowCoordinateSystem from './functions/estimate-coords';
import type fibonacci from './functions/fibonacci';
import type loadShow from './functions/load-show';

// We cannot use Asyncify directly from type-fest because workerpool promises
// have extra methods that we want to expose
export type Asyncify<Function_ extends (...arguments_: any[]) => any> =
  SetReturnType<Function_, Promise<Awaited<ReturnType<Function_>>>>;

/**
 * Type specification for the API of functions exposed by the worker module.
 */
export type WorkerApi = {
  estimateShowCoordinateSystem: Asyncify<typeof estimateShowCoordinateSystem>;
  fibonacci: Asyncify<typeof fibonacci>;
  loadShow: Asyncify<typeof loadShow>;
};

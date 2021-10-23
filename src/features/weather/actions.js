import messageHub from '~/message-hub';
import { createAsyncAction } from '~/utils/redux';

/**
 * Action factory that creates an action that initiates an update of the weather
 * data from the server.
 */
export const updateWeatherData = createAsyncAction(
  'weather/loading',
  (location) => messageHub.query.getWeatherInformation(location),
  { minDelay: 500 }
);

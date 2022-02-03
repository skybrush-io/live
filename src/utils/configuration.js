import config from 'config';
import get from 'lodash-es/get';
import isNil from 'lodash-es/isNil';

/**
 * Returns whether the configuration object indicates that the user is allowed
 * to see a particular feature.
 */
export const hasFeature = (name) =>
  config && Boolean(get(config, `features.${name}`, true));

/**
 * Returns whether the configuration object indicates that the user has a
 * time-limited session.
 */
export const hasTimeLimitedSession = !isNil(
  config?.session?.maxLengthInSeconds
);

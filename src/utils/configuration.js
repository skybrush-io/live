import config from 'config';
import get from 'lodash-es/get';

/**
 * Returns whether the configuration object indicates that the user is allowed
 * to see a particular feature.
 */
export const hasFeature = (name) =>
  config && !!get(config, `features.${name}`, true);

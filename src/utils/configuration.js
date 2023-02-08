import config from 'config';
import isNil from 'lodash-es/isNil';

/**
 * Returns whether the configuration object indicates that the user is allowed
 * to see a particular feature.
 */
export const hasFeature = (name) => config?.features?.[name] ?? true;

/**
 * Returns whether the configuration object indicates that the user has a
 * time-limited session.
 */
export const hasTimeLimitedSession = !isNil(
  config?.session?.maxLengthInSeconds
);

/**
 * Returns the default workbench perspective from the configuration object.
 */
export const getDefaultWorkbenchPerspectiveSpecification = () => {
  const perspectives = config?.perspectives;

  if (perspectives && Array.isArray(perspectives) && perspectives.length > 0) {
    return perspectives[0];
  } else {
    return { inherits: 'default' };
  }
};

import config, { type Config } from 'config';
import isNil from 'lodash-es/isNil';
import { type Perspective } from 'perspective';

export type FeatureName = keyof Config['features'];

/**
 * Returns whether the configuration object indicates that the user is allowed
 * to see a particular feature.
 */
export const hasFeature = (name: FeatureName): boolean =>
  config?.features?.[name] ?? true;

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
export const getDefaultWorkbenchPerspectiveSpecification = (): Perspective => {
  const perspectives = config?.perspectives;

  if (Array.isArray(perspectives) && perspectives[0]) {
    return perspectives[0];
  } else {
    return 'default';
  }
};

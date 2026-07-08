import config from 'config';

import { PerspectiveStorage } from 'react-flexible-workbench';

import { createPerspectiveBuilder } from './features/perspectives/utils';
import { hasFeature } from './utils/configuration';
import workbench, { componentRegistry } from './workbench';

const buildPerspective = createPerspectiveBuilder(componentRegistry, workbench);

export const perspectives = PerspectiveStorage.fromArray(
  hasFeature('perspectives') ? config.perspectives.map(buildPerspective) : []
);

// Temporary hack to prevent the "perspective modified" badge from appearing
// until we move the storage of perspectives into the store and allow the user
// to create new perspectives or modify or remove existing ones
perspectives.isModified = () => false;

export default perspectives;

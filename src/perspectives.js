import config from 'config';

import {
  PerspectiveBuilder,
  PerspectiveStorage,
} from 'react-flexible-workbench';

import workbench, { componentRegistry } from './workbench';

const addLayoutToPerspective = (perspectiveBuilder, layout) => {
  const typeMapping = {
    rows: 'makeRows',
    columns: 'makeColumns',
    stack: 'makeStack',
  };

  switch (layout.type) {
    case 'columns':
    case 'rows':
    case 'stack': {
      perspectiveBuilder[typeMapping[layout.type]]();
      for (const c of layout.contents) {
        addLayoutToPerspective(perspectiveBuilder, c);
      }

      perspectiveBuilder.finish();

      break;
    }

    case 'panel': {
      perspectiveBuilder
        .add(layout.component)
        .setTitle(componentRegistry[layout.component].label);

      if (layout.id) {
        perspectiveBuilder.setId(layout.id);
      }

      break;
    }

    default: {
      throw new Error(`Unknown layout type: ${layout.type}`);
    }
  }

  if (layout.width) {
    perspectiveBuilder.setRelativeWidth(layout.width);
  }

  if (layout.height) {
    perspectiveBuilder.setRelativeHeight(layout.height);
  }
};

const buildPerspective = ({ hideHeaders, isFixed, label, layout }) => {
  const perspectiveBuilder = new PerspectiveBuilder(workbench);

  addLayoutToPerspective(perspectiveBuilder, layout);

  return {
    label,
    isFixed,
    state: {
      content: perspectiveBuilder.build(),
      settings: { hasHeaders: !hideHeaders },
    },
  };
};

export const perspectives = PerspectiveStorage.fromArray(
  config.perspectives.map(buildPerspective)
);

// Temporary hack to prevent the "perspective modified" badge from appearing
// until we move the storage of perspectives into the store and allow the user
// to create new perspectives or modify or remove existing ones
perspectives.isModified = () => false;

export default perspectives;

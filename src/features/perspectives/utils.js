import { PerspectiveBuilder } from 'react-flexible-workbench';

import commonLayouts from './common';

const addLayoutToPerspective = (layout, context) => {
  const typeMapping = {
    rows: 'makeRows',
    columns: 'makeColumns',
    stack: 'makeStack',
  };
  const { perspectiveBuilder, componentRegistry } = context;

  switch (layout.type) {
    case 'columns':
    case 'rows':
    case 'stack': {
      perspectiveBuilder[typeMapping[layout.type]]();
      for (const c of layout.contents) {
        addLayoutToPerspective(c, context);
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

/**
 * Creates a perspective builder function that takes perspective specifications.
 *
 * Perspective builder functions are parameterized by the specification of the
 * perspective. The specification may be a string representing the name of a
 * common layout, or an object accepted by `addLayoutToPerspective`.
 * Inheritance is supported with a top-level `inherits` keyword that refers to
 * the name of a common layout to inherit from.
 *
 * @param {object} componentRegsitry  the component registry that associates
 *        component IDs to React components, labels and other visual properties
 * @param {object} workbench  the workbench that the builder function will operate on
 */
export const createPerspectiveBuilder =
  (componentRegistry, workbench) => (nameOrOptions) => {
    let options =
      (typeof nameOrOptions === 'string'
        ? { inherits: nameOrOptions }
        : nameOrOptions) || {};

    // Resolve inheritance
    while (options.inherits) {
      const parent = commonLayouts[options.inherits] || {};
      delete options.inherits;

      options = { ...parent, ...options };
    }

    const { hideHeaders, isFixed, label, layout } = options;
    const perspectiveBuilder = new PerspectiveBuilder(workbench);

    addLayoutToPerspective(layout, { perspectiveBuilder, componentRegistry });

    return {
      label,
      isFixed,
      state: {
        content: perspectiveBuilder.build(),
        settings: { hasHeaders: !hideHeaders },
      },
    };
  };

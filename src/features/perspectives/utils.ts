import type {
  PerspectiveLayout,
  PerspectiveName,
  PerspectiveObject,
} from 'perspective';
import {
  PerspectiveBuilder as PerspectiveBuilder_,
  type Workbench,
} from 'react-flexible-workbench';

import type { ComponentRegistry } from '~/features/workbench/types';

import commonLayouts from './common';
import type { Perspective } from './types';

type AddLayoutContext = {
  perspectiveBuilder: PerspectiveBuilder_;
  componentRegistry: ComponentRegistry;
};

const addLayoutToPerspective = (
  layout: PerspectiveLayout,
  context: AddLayoutContext
) => {
  const { perspectiveBuilder, componentRegistry } = context;

  switch (layout.type) {
    case 'columns':
    case 'rows':
    case 'stack': {
      if (layout.type === 'columns') {
        perspectiveBuilder.makeColumns();
      } else if (layout.type === 'rows') {
        perspectiveBuilder.makeRows();
      } else if (layout.type === 'stack') {
        perspectiveBuilder.makeStack();
      }
      for (const c of layout.contents) {
        addLayoutToPerspective(c, context);
      }

      perspectiveBuilder.finish();

      break;
    }

    case 'panel': {
      perspectiveBuilder
        .add(layout.component)
        .setTitle(componentRegistry[layout.component].label ?? '');

      if (layout.id) {
        perspectiveBuilder.setId(layout.id);
      }

      break;
    }

    default: {
      throw new Error(
        `Unknown layout type: ${(layout as PerspectiveLayout).type}`
      );
    }
  }

  if (layout.width) {
    perspectiveBuilder.setRelativeWidth(layout.width);
  }

  if (layout.height) {
    perspectiveBuilder.setRelativeHeight(layout.height);
  }
};

type PerspectiveObjectWithInheritance = PerspectiveObject & {
  inherits?: string;
};

type PerspectiveBuilder = (
  nameOrSpec: PerspectiveName | PerspectiveObjectWithInheritance
) => Perspective;

/**
 * Creates a perspective builder function that takes perspective specifications.
 *
 * Perspective builder functions are parameterized by the specification of the
 * perspective. The specification may be a string representing the name of a
 * common layout, or an object accepted by `addLayoutToPerspective`.
 * Inheritance is supported with a top-level `inherits` keyword that refers to
 * the name of a common layout to inherit from.
 *
 * @param componentRegsitry  the component registry that associates
 *        component IDs to React components, labels and other visual properties
 * @param workbench  the workbench that the builder function will operate on
 */
export const createPerspectiveBuilder =
  (
    componentRegistry: ComponentRegistry,
    workbench: Workbench
  ): PerspectiveBuilder =>
  (nameOrSpec: PerspectiveName | PerspectiveObjectWithInheritance) => {
    let options: PerspectiveObjectWithInheritance =
      (typeof nameOrSpec === 'string'
        ? ({ inherits: nameOrSpec } as PerspectiveObjectWithInheritance)
        : nameOrSpec) || {};

    // Resolve inheritance
    while (options.inherits) {
      const parent = commonLayouts[options.inherits] || {};
      delete options.inherits;

      options = { ...parent, ...options };
    }

    const { hideHeaders, isFixed, label, layout } = options;
    const perspectiveBuilder = new PerspectiveBuilder_(workbench);

    addLayoutToPerspective(layout, { perspectiveBuilder, componentRegistry });

    return {
      label,
      isFixed: Boolean(isFixed),
      state: {
        content: perspectiveBuilder.build(),
        settings: { hasHeaders: !hideHeaders },
      },
    };
  };

// This file is needed to allow custom A-Frame elements like <a-entity />
// to be used in TSX files without type errors.

import type * as React from 'react';

type AnyKey = Record<string, any>;

type CustomAFrameElement<T = AnyKey> = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLElement>,
  HTMLElement
> &
  T;

declare module 'react' {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface IntrinsicElements {
      'a-arrow': CustomAFrameElement;
      'a-assets': CustomAFrameElement;
      'a-asset-item': CustomAFrameElement;
      'a-box': CustomAFrameElement;
      'a-camera': CustomAFrameElement;
      'a-drone-flock': CustomAFrameElement;
      'a-entity': CustomAFrameElement;
      'a-mixin': CustomAFrameElement;
      'a-scene': CustomAFrameElement;
    }
  }
}

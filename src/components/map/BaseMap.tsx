import { defaults as defaultOLInteractions } from 'ol/interaction/defaults';
import React, { forwardRef, useMemo } from 'react';

// @ts-expect-error
import { Map as OLMap } from '@collmot/ol-react';

import 'ol/ol.css';

type BaseMapProps = React.ComponentProps<typeof OLMap>;

/**
 * Base map component that overides some OpenLayers map defaults.
 *
 * Overridden defaults:
 * - `controls`: disable keyboard controls, because they conflict
 *   with certain application hotkeys.
 */
const BaseMap = forwardRef(
  (props: BaseMapProps, ref: React.Ref<HTMLElement>) => {
    const { interactions, ...rest } = props;

    // Every map must have its own interaction object instances!
    const effectiveInteractions = useMemo(
      () => interactions ?? defaultOLInteractions({ keyboard: false }),
      [interactions]
    );

    return <OLMap interactions={effectiveInteractions} ref={ref} {...rest} />;
  }
);

export default BaseMap;

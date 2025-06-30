import { defaults as defaultOLInteractions } from 'ol/interaction/defaults';
import React, { forwardRef } from 'react';

// @ts-expect-error
import { Map as OLMap } from '@collmot/ol-react';

import 'ol/ol.css';

type BaseMapProps = React.ComponentProps<typeof OLMap>;

const _defaultInteractions = defaultOLInteractions({
  keyboard: false,
});

/**
 * Base map component that overides some OpenLayers map defaults.
 *
 * Overridden defaults:
 * - `controls`: disable keyboard controls, because they conflict
 *   with certain application hotkeys.
 */
const BaseMap = forwardRef(
  (props: BaseMapProps, ref: React.Ref<HTMLElement>) => {
    const { interactions = _defaultInteractions, ...rest } = props;

    return <OLMap interactions={interactions} ref={ref} {...rest} />;
  }
);

export default BaseMap;

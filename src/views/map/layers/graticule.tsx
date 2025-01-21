import React from 'react';
import { useSelector } from 'react-redux';

import { GraticuleLayer as GraticuleLayerPresentation } from '~/components/map/layers/graticule';
import type { Layer } from '~/model/layers';
import {
  getPreferredCoordinateFormat,
  getPreferredLatitudeCoordinateFormatter,
  getPreferredLongitudeCoordinateFormatter,
} from '~/selectors/formatting';

type GraticuleLayerProps = {
  layer: Layer;
  zIndex?: number;
};

export const GraticuleLayer = ({ layer, zIndex }: GraticuleLayerProps) => {
  const latFormatter = useSelector(getPreferredLatitudeCoordinateFormatter);
  const lonFormatter = useSelector(getPreferredLongitudeCoordinateFormatter);
  const coordinateformat = useSelector(getPreferredCoordinateFormat);
  return (
    <GraticuleLayerPresentation
      layer={layer}
      coordinateformat={coordinateformat}
      latFormatter={latFormatter}
      lonFormatter={lonFormatter}
      zIndex={zIndex}
    />
  );
};

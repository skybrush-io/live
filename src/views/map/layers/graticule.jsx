import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Text from 'ol/style/Text';
import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';

import { layer as OLLayer } from '@collmot/ol-react';

import {
  getPreferredLatitudeCoordinateFormatter,
  getPreferredLongitudeCoordinateFormatter,
} from '~/selectors/formatting';

// === Settings for this particular layer type ===

export const GraticuleLayerSettings = () => null;

// === The actual layer to be rendered ===

const lonLabelStyle = new Text({
  font: "14px 'Fira Sans',Calibri,sans-serif",
  textBaseline: 'bottom',
  fill: new Fill({
    color: 'rgba(0,0,0,1)',
  }),
  stroke: new Stroke({
    color: 'rgba(255,255,255,1)',
    width: 3,
  }),
});

const latLabelStyle = new Text({
  font: "14px 'Fira Sans',Calibri,sans-serif",
  textAlign: 'end',
  fill: new Fill({
    color: 'rgba(0,0,0,1)',
  }),
  stroke: new Stroke({
    color: 'rgba(255,255,255,1)',
    width: 3,
  }),
});

export const GraticuleLayer = ({ layer, zIndex }) => {
  const latFormatter = useSelector(getPreferredLatitudeCoordinateFormatter);
  const lonFormatter = useSelector(getPreferredLongitudeCoordinateFormatter);
  return (
    <OLLayer.Graticule
      showLabels
      latLabelFormatter={latFormatter}
      latLabelStyle={latLabelStyle}
      lonLabelFormatter={lonFormatter}
      lonLabelStyle={lonLabelStyle}
      zIndex={zIndex}
    />
  );
};

GraticuleLayer.propTypes = {
  layer: PropTypes.object,
  zIndex: PropTypes.number,
};

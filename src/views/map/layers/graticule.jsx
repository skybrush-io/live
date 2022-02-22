import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Text from 'ol/style/Text';
import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';

import { layer as OLLayer } from '@collmot/ol-react';

import useDarkMode from '~/hooks/useDarkMode';
import {
  getPreferredLatitudeCoordinateFormatter,
  getPreferredLongitudeCoordinateFormatter,
} from '~/selectors/formatting';

// TODO(ntamas): implement support for setting the stroke width and color

// === The actual layer to be rendered ===

const createLonLabelStyle = (isDark = false) =>
  new Text({
    font: "14px 'Fira Sans',Calibri,sans-serif",
    textBaseline: 'bottom',
    fill: new Fill({
      color: isDark ? 'rgba(255, 255, 255, 1)' : 'rgba(0,0,0,1)',
    }),
    stroke: new Stroke({
      color: isDark ? 'rgba(0, 0, 0, 1)' : 'rgba(255,255,255,1)',
      width: 3,
    }),
  });

const createLatLabelStyle = (isDark = false) =>
  new Text({
    font: "14px 'Fira Sans',Calibri,sans-serif",
    textAlign: 'end',
    fill: new Fill({
      color: isDark ? 'rgba(255, 255, 255, 1)' : 'rgba(0,0,0,1)',
    }),
    stroke: new Stroke({
      color: isDark ? 'rgba(0, 0, 0, 1)' : 'rgba(255,255,255,1)',
      width: 3,
    }),
  });

const lonLabelStyles = {
  light: createLonLabelStyle(),
  dark: createLonLabelStyle(true),
};

const latLabelStyles = {
  light: createLatLabelStyle(),
  dark: createLatLabelStyle(true),
};

export const GraticuleLayer = ({ layer, zIndex }) => {
  const isDark = useDarkMode();
  const latFormatter = useSelector(getPreferredLatitudeCoordinateFormatter);
  const lonFormatter = useSelector(getPreferredLongitudeCoordinateFormatter);
  return (
    <OLLayer.Graticule
      showLabels
      latLabelFormatter={latFormatter}
      latLabelStyle={latLabelStyles[isDark ? 'dark' : 'light']}
      lonLabelFormatter={lonFormatter}
      lonLabelStyle={lonLabelStyles[isDark ? 'dark' : 'light']}
      zIndex={zIndex}
    />
  );
};

GraticuleLayer.propTypes = {
  layer: PropTypes.object,
  zIndex: PropTypes.number,
};

import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Text from 'ol/style/Text';
import PropTypes from 'prop-types';
import React from 'react';
import { useSelector } from 'react-redux';

import { layer as OLLayer } from '@collmot/ol-react';

import useDarkMode from '~/hooks/useDarkMode';
import {
  getPreferredCoordinateFormat,
  getPreferredLatitudeCoordinateFormatter,
  getPreferredLongitudeCoordinateFormatter,
} from '~/selectors/formatting';
import { CoordinateFormat } from '~/model/settings';

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

const GRATICULE_INTERVALS_ALIGNED_TO_DEGREES_MINUTES_AND_SECONDS = [
  90,
  45,
  30,
  20,
  10,
  5,
  2,
  1,
  30 / 60,
  20 / 60,
  10 / 60,
  5 / 60,
  2 / 60,
  1 / 60,
  30 / 3600,
  20 / 3600,
  10 / 3600,
  5 / 3600,
  2 / 3600,
  1 / 3600,
];

const GRATICULE_INTERVALS_ALIGNED_TO_DEGREES_AND_MINUTES = [
  90,
  45,
  30,
  20,
  10,
  5,
  2,
  1,
  30 / 60,
  20 / 60,
  10 / 60,
  5 / 60,
  2 / 60,
  1 / 60,
  1 / 120,
  1 / 300,
  1 / 600,
  1 / 1200,
  1 / 6000,
];

const GRATICULE_INTERVALS_ALIGNED_TO_DEGREES = [
  90, 45, 30, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05, 0.01, 0.005, 0.002, 0.001,
];

/**
 * Returns an array of intervals that the graticules will be aligned to. This
 * is needed to ensure that the graticule labels look nice using the formatter
 * preferred by the user. In other words, if the formatter shows minutes and
 * seconds, then we prefer to put the graticule lines to whole minutes and
 * seconds, otherwise we prefer to align them with degrees that look nice in
 * decimal format.
 */
function getPreferredGraticuleIntervals(state) {
  const format = getPreferredCoordinateFormat(state);

  switch (format) {
    case CoordinateFormat.DEGREES:
    case CoordinateFormat.SIGNED_DEGREES:
      return GRATICULE_INTERVALS_ALIGNED_TO_DEGREES;

    case CoordinateFormat.DEGREES_MINUTES:
    case CoordinateFormat.SIGNED_DEGREES_MINUTES:
      return GRATICULE_INTERVALS_ALIGNED_TO_DEGREES_AND_MINUTES;

    default:
      return GRATICULE_INTERVALS_ALIGNED_TO_DEGREES_MINUTES_AND_SECONDS;
  }
}

export const GraticuleLayer = ({ layer, zIndex }) => {
  const isDark = useDarkMode();
  const latFormatter = useSelector(getPreferredLatitudeCoordinateFormatter);
  const lonFormatter = useSelector(getPreferredLongitudeCoordinateFormatter);
  const intervals = useSelector(getPreferredGraticuleIntervals);
  return (
    <OLLayer.Graticule
      showLabels
      intervals={intervals}
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

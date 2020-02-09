import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import * as Coordinate from 'ol/coordinate';
import Point from 'ol/geom/Point';
import { Circle, RegularShape, Style, Text } from 'ol/style';

import { Feature, geom, layer, source } from '@collmot/ol-react';

import {
  getHomePositionsInMission,
  getLandingPositionsInMission
} from '~/features/mission/selectors';
import {
  homePositionIdToGlobalId,
  landingPositionIdToGlobalId,
  originIdToGlobalId
} from '~/model/identifiers';
import { setLayerEditable, setLayerSelectable } from '~/model/layers';
import { getMapOriginRotationAngle } from '~/selectors/map';
import { getSelectedOriginIds } from '~/selectors/selection';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import { toRadians } from '~/utils/math';
import {
  fill,
  stroke,
  whiteThickOutline,
  whiteThinOutline
} from '~/utils/styles';

// === Settings for this particular layer type ===

const HomePositionsLayerSettingsPresentation = () => null;

HomePositionsLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string
};

export const HomePositionsLayerSettings = connect(
  // mapStateToProps
  () => ({})
)(HomePositionsLayerSettingsPresentation);

// === The actual layer to be rendered ===

function markAsSelectable(layer) {
  if (layer) {
    setLayerEditable(layer.layer);
    setLayerSelectable(layer.layer);
  }
}

/**
 * Styling for stroke of the X axis of the coordinate system.
 */
const redLine = stroke('#f44', 2);

/**
 * Styling for the stroke of the Y axis of the coordinate system.
 */
const greenLine = stroke('#4f4', 2);

/**
 * Red fill color to use for takeoff markers.
 */
const redFill = fill('#f44');

/**
 * Green fill color to use for landing markers.
 */
const greenFill = fill('#3c3');

/**
 * Styling function for the marker representing the origin of the map
 * coordinate system.
 */
const originStyles = (selected, axis) => [
  // Circle and label
  new Style({
    geometry: feature => {
      const geom = feature.getGeometry();
      const origin = geom.getFirstCoordinate();
      return new Point(origin);
    },
    image: new Circle({
      fill: redFill,
      radius: 8,
      stroke: selected ? whiteThickOutline : whiteThinOutline
    }),
    text: new Text({
      font: '12px sans-serif',
      offsetY: 16,
      text: 'Origin',
      textAlign: 'center'
    })
  }),

  // Arrow
  new Style({
    stroke: axis === 'x' ? redLine : greenLine
  })
];

/**
 * Style for the marker representing the takeoff positions of the drones in
 * the current mission.
 */
const takeoffPositionStyle = text =>
  new Style({
    image: new RegularShape({
      fill: redFill,
      points: 3,
      radius: 6
    }),

    text: new Text({
      font: '12px sans-serif',
      offsetY: 12,
      text,
      textAlign: 'center'
    })
  });

/**
 * Style for the marker representing the landing positions of the drones in
 * the current mission.
 */
const landingPositionStyle = text =>
  new Style({
    image: new RegularShape({
      fill: greenFill,
      points: 3,
      radius: 6,
      rotation: Math.PI
    }),

    text: new Text({
      font: '12px sans-serif',
      offsetY: -12,
      text,
      textAlign: 'center'
    })
  });

const HomePositionsVectorSource = ({
  coordinateSystemType,
  homePositions,
  landingPositions,
  orientation,
  origin,
  selectedOriginIds
}) => {
  const features = [];

  features.push(
    ...homePositions
      .map((homePosition, index) => {
        const featureKey = `home..${index}`;

        if (!homePosition) {
          return null;
        }

        const globalIdOfFeature = homePositionIdToGlobalId(index);
        const center = mapViewCoordinateFromLonLat([
          homePosition.lon,
          homePosition.lat
        ]);

        return (
          <Feature
            key={featureKey}
            id={globalIdOfFeature}
            style={takeoffPositionStyle(`s${index}`)}
          >
            <geom.Point coordinates={center} />
          </Feature>
        );
      })
      .filter(Boolean)
  );

  features.push(
    ...landingPositions
      .map((landingPosition, index) => {
        const featureKey = `land.${index}`;

        if (!landingPosition) {
          return null;
        }

        const globalIdOfFeature = landingPositionIdToGlobalId(index);
        const center = mapViewCoordinateFromLonLat([
          landingPosition.lon,
          landingPosition.lat
        ]);

        return (
          <Feature
            key={featureKey}
            id={globalIdOfFeature}
            style={landingPositionStyle(`s${index}`)}
          >
            <geom.Point coordinates={center} />
          </Feature>
        );
      })
      .filter(Boolean)
  );

  if (origin) {
    const globalIdOfOrigin = originIdToGlobalId('');
    const tail = mapViewCoordinateFromLonLat(origin);
    const armLength = 50; /* meters */
    const headY = [0, coordinateSystemType === 'nwu' ? armLength : -armLength];
    const headX = [armLength, 0];
    Coordinate.rotate(headX, toRadians(90 - orientation));
    Coordinate.rotate(headY, toRadians(90 - orientation));
    Coordinate.add(headY, tail);
    Coordinate.add(headX, tail);
    features.push(
      <Feature
        key="x"
        id={globalIdOfOrigin + '$x'}
        style={originStyles(selectedOriginIds.includes(''), 'x')}
      >
        <geom.LineString coordinates={[tail, headX]} />
      </Feature>,
      <Feature
        key="y"
        id={globalIdOfOrigin}
        style={originStyles(selectedOriginIds.includes(''), 'y')}
      >
        <geom.LineString coordinates={[tail, headY]} />
      </Feature>
    );
  }

  return <source.Vector>{features}</source.Vector>;
};

HomePositionsVectorSource.propTypes = {
  coordinateSystemType: PropTypes.oneOf(['neu', 'nwu']),
  homePositions: PropTypes.arrayOf(
    PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lon: PropTypes.number.isRequired
    })
  ),
  landingPositions: PropTypes.arrayOf(
    PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lon: PropTypes.number.isRequired
    })
  ),
  orientation: PropTypes.number,
  origin: PropTypes.arrayOf(PropTypes.number),
  selectedOriginIds: PropTypes.arrayOf(PropTypes.string)
};

HomePositionsVectorSource.defaultProps = {
  orientation: 0
};

const HomePositionsLayerPresentation = ({ zIndex, ...rest }) => (
  <layer.Vector
    ref={markAsSelectable}
    updateWhileAnimating
    updateWhileInteracting
    zIndex={zIndex}
  >
    <HomePositionsVectorSource {...rest} />
  </layer.Vector>
);

HomePositionsLayerPresentation.propTypes = {
  zIndex: PropTypes.number
};

export const HomePositionsLayer = connect(
  // mapStateToProps
  state => ({
    coordinateSystemType: state.map.origin.type,
    homePositions: getHomePositionsInMission(state),
    landingPositions: getLandingPositionsInMission(state),
    orientation: getMapOriginRotationAngle(state),
    origin: state.map.origin.position,
    selectedOriginIds: getSelectedOriginIds(state)
  }),
  // mapDispatchToProps
  () => ({})
)(HomePositionsLayerPresentation);

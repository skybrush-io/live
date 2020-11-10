import memoizeOne from 'memoize-one';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import * as Coordinate from 'ol/coordinate';
import Point from 'ol/geom/Point';
import { getPointResolution } from 'ol/proj';
import { Circle, Icon, RegularShape, Style, Text } from 'ol/style';

import { Feature, geom, layer as olLayer, source } from '@collmot/ol-react';

import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';

import { setLayerParameterById } from '~/actions/layers';
import Colors from '~/components/colors';
import {
  getGPSBasedHomePositionsInMission,
  getGPSBasedLandingPositionsInMission,
} from '~/features/mission/selectors';
import {
  getOutdoorShowOrientation,
  getOutdoorShowOrigin,
} from '~/features/show/selectors';
import {
  globalIdToHomePositionId,
  globalIdToLandingPositionId,
  homePositionIdToGlobalId,
  landingPositionIdToGlobalId,
  originIdToGlobalId,
} from '~/model/identifiers';
import { setLayerEditable, setLayerSelectable } from '~/model/layers';
import { getMapOriginRotationAngle } from '~/selectors/map';
import { getSelectedOriginIds } from '~/selectors/selection';
import { formatMissionId } from '~/utils/formatting';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import { toRadians } from '~/utils/math';
import CustomPropTypes from '~/utils/prop-types';
import {
  blackVeryThinOutline,
  fill,
  stroke,
  whiteThickOutline,
  whiteThinOutline,
} from '~/utils/styles';

const missionOriginMarker = require('~/../assets/img/mission-origin-marker.svg')
  .default;

// === Settings for this particular layer type ===

const MissionInfoLayerSettingsPresentation = ({ layer, setLayerParameter }) => {
  const { parameters } = layer;
  const {
    showOrigin,
    showHomePositions,
    showLandingPositions,
    showMissionOrigin,
  } = parameters || {};

  const handleChange = (name) => (event) =>
    setLayerParameter(name, event.target.checked);

  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Checkbox
            checked={showOrigin}
            value='showOrigin'
            onChange={handleChange('showOrigin')}
          />
        }
        label='Show map origin'
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={showMissionOrigin}
            value='showMissionOrigin'
            onChange={handleChange('showMissionOrigin')}
          />
        }
        label='Show mission origin'
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={showHomePositions}
            value='showHomePositions'
            onChange={handleChange('showHomePositions')}
          />
        }
        label='Show home positions'
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={showLandingPositions}
            value='showLandingPositions'
            onChange={handleChange('showLandingPositions')}
          />
        }
        label='Show landing positions'
      />
    </FormGroup>
  );
};

MissionInfoLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  setLayerParameter: PropTypes.func,
};

export const MissionInfoLayerSettings = connect(
  // mapStateToProps
  () => ({
    homePositionsVisible: true,
    landingPositionsVisible: true,
    originVisible: true,
  }),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    setLayerParameter: (parameter, value) => {
      dispatch(setLayerParameterById(ownProps.layerId, parameter, value));
    },
  })
)(MissionInfoLayerSettingsPresentation);

// === The actual layer to be rendered ===

function markAsSelectableAndEditable(layer) {
  if (layer) {
    setLayerEditable(layer.layer);
    setLayerSelectable(layer.layer);
  }
}

/**
 * Styling for stroke of the X axis of the coordinate system.
 */
const redLine = stroke(Colors.axisColors.x, 2);

/**
 * Styling for the stroke of the Y axis of the coordinate system.
 */
const greenLine = stroke(Colors.axisColors.y, 2);

/**
 * Fill color to use for the origin marker.
 */
const originMarkerFill = fill(Colors.originMarker);

/**
 * Fill color to use for takeoff markers.
 */
const takeoffMarkerFill = fill(Colors.takeoffMarker);

/**
 * Green fill color to use for landing markers.
 */
const landingMarkerFill = fill(Colors.landingMarker);

/**
 * Styling function for the marker representing the origin of the map
 * coordinate system.
 */
const originStyles = (selected, axis) => [
  // Circle and label
  new Style({
    geometry: (feature) => {
      const geom = feature.getGeometry();
      const origin = geom.getFirstCoordinate();
      return new Point(origin);
    },
    image: new Circle({
      fill: originMarkerFill,
      radius: 8,
      stroke: selected ? whiteThickOutline : whiteThinOutline,
    }),
    /*
    text: new Text({
      font: '12px sans-serif',
      offsetY: 16,
      text: 'Origin',
      textAlign: 'center',
    }),
    */
  }),

  // Arrow
  new Style({
    stroke: axis === 'x' ? redLine : greenLine,
  }),
];

/**
 * Style for the marker representing the takeoff positions of the drones in
 * the current mission.
 */
const takeoffPositionStyle = (feature, resolution) => {
  const index = globalIdToHomePositionId(feature.getId());
  const style = {
    image: new RegularShape({
      fill: takeoffMarkerFill,
      points: 3,
      radius: 6,
      stroke: blackVeryThinOutline,
    }),
  };

  if (resolution < 0.4) {
    style.text = new Text({
      font: '12px sans-serif',
      offsetY: 12,
      text: formatMissionId(Number.parseInt(index, 10)),
      textAlign: 'center',
    });
  }

  return new Style(style);
};

/**
 * Style for the marker representing the landing positions of the drones in
 * the current mission.
 */
const landingPositionStyle = (feature, resolution) => {
  const index = globalIdToLandingPositionId(feature.getId());
  const style = {
    image: new RegularShape({
      fill: landingMarkerFill,
      points: 3,
      radius: 6,
      rotation: Math.PI,
      stroke: blackVeryThinOutline,
    }),
  };

  if (resolution < 0.4) {
    style.text = new Text({
      font: '12px sans-serif',
      offsetY: -12,
      text: formatMissionId(Number.parseInt(index, 10)),
      textAlign: 'center',
    });
  }

  return new Style(style);
};

/**
 * Style for the marker representing the origin of the mission-specific
 * coordinate system.
 */
const createMissionOriginStyle = memoizeOne(
  (heading) =>
    new Style({
      image: new Icon({
        src: missionOriginMarker,
        rotateWithView: true,
        rotation: toRadians(heading),
        snapToPixel: false,
      }),
    })
);

const MAP_ORIGIN_ID = 'map';
const MISSION_ORIGIN_ID = 'mission';

const HomePositionsVectorSource = ({
  coordinateSystemType,
  homePositions,
  landingPositions,
  missionOrientation,
  missionOrigin,
  orientation,
  origin,
  selectedOriginIds,
  showHomePositions,
  showLandingPositions,
  showMissionOrigin,
  showOrigin,
}) => {
  const features = [];

  if (showLandingPositions) {
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
            landingPosition.lat,
          ]);

          return (
            <Feature
              key={featureKey}
              id={globalIdOfFeature}
              style={landingPositionStyle}
            >
              <geom.Point coordinates={center} />
            </Feature>
          );
        })
        .filter(Boolean)
    );
  }

  if (showHomePositions) {
    features.push(
      ...homePositions
        .map((homePosition, index) => {
          const featureKey = `home.${index}`;

          if (!homePosition) {
            return null;
          }

          const globalIdOfFeature = homePositionIdToGlobalId(index);
          const center = mapViewCoordinateFromLonLat([
            homePosition.lon,
            homePosition.lat,
          ]);

          return (
            <Feature
              key={featureKey}
              id={globalIdOfFeature}
              style={takeoffPositionStyle}
            >
              <geom.Point coordinates={center} />
            </Feature>
          );
        })
        .filter(Boolean)
    );
  }

  if (showOrigin && origin) {
    const globalIdOfOrigin = originIdToGlobalId(MAP_ORIGIN_ID);
    const tail = mapViewCoordinateFromLonLat(origin);
    const armLength =
      50 /* meters */ / getPointResolution('EPSG:3857', 1, tail);
    const headY = [0, coordinateSystemType === 'nwu' ? armLength : -armLength];
    const headX = [armLength, 0];
    Coordinate.rotate(headX, toRadians(90 - orientation));
    Coordinate.rotate(headY, toRadians(90 - orientation));
    Coordinate.add(headY, tail);
    Coordinate.add(headX, tail);
    features.push(
      <Feature
        key='mapOrigin.x'
        id={globalIdOfOrigin + '$x'}
        style={originStyles(selectedOriginIds.includes(MAP_ORIGIN_ID), 'x')}
      >
        <geom.LineString coordinates={[tail, headX]} />
      </Feature>,
      <Feature
        key='mapOrigin.y'
        id={globalIdOfOrigin}
        style={originStyles(selectedOriginIds.includes(MAP_ORIGIN_ID), 'y')}
      >
        <geom.LineString coordinates={[tail, headY]} />
      </Feature>
    );
  }

  if (showMissionOrigin && missionOrigin) {
    const globalIdOfMissionOrigin = originIdToGlobalId(MISSION_ORIGIN_ID);
    const missionOriginCoord = mapViewCoordinateFromLonLat(missionOrigin);
    features.push(
      <Feature
        key='missionOrigin'
        id={globalIdOfMissionOrigin}
        style={createMissionOriginStyle(missionOrientation)}
      >
        <geom.Point coordinates={missionOriginCoord} />
      </Feature>
    );
  }

  return <source.Vector>{features}</source.Vector>;
};

HomePositionsVectorSource.propTypes = {
  coordinateSystemType: PropTypes.oneOf(['neu', 'nwu']),
  homePositions: PropTypes.arrayOf(CustomPropTypes.coordinate),
  landingPositions: PropTypes.arrayOf(CustomPropTypes.coordinate),
  missionOrientation: CustomPropTypes.angle,
  missionOrigin: PropTypes.arrayOf(PropTypes.number),
  orientation: CustomPropTypes.angle,
  origin: PropTypes.arrayOf(PropTypes.number),
  selectedOriginIds: PropTypes.arrayOf(PropTypes.string),
  showHomePositions: PropTypes.bool,
  showLandingPositions: PropTypes.bool,
  showMissionOrigin: PropTypes.bool,
  showOrigin: PropTypes.bool,
};

HomePositionsVectorSource.defaultProps = {
  orientation: 0,
};

const MissionInfoLayerPresentation = ({ layer, zIndex, ...rest }) => (
  <olLayer.Vector
    ref={markAsSelectableAndEditable}
    updateWhileAnimating
    updateWhileInteracting
    zIndex={zIndex}
  >
    <HomePositionsVectorSource
      showHomePositions={layer.parameters.showHomePositions}
      showLandingPositions={layer.parameters.showLandingPositions}
      showMissionOrigin={layer.parameters.showMissionOrigin}
      showOrigin={layer.parameters.showOrigin}
      {...rest}
    />
  </olLayer.Vector>
);

MissionInfoLayerPresentation.propTypes = {
  layer: PropTypes.object,
  zIndex: PropTypes.number,
};

export const MissionInfoLayer = connect(
  // mapStateToProps
  (state) => ({
    coordinateSystemType: state.map.origin.type,
    homePositions: getGPSBasedHomePositionsInMission(state),
    landingPositions: getGPSBasedLandingPositionsInMission(state),
    missionOrigin: getOutdoorShowOrigin(state),
    missionOrientation: getOutdoorShowOrientation(state),
    orientation: getMapOriginRotationAngle(state),
    origin: state.map.origin.position,
    selectedOriginIds: getSelectedOriginIds(state),
  }),
  // mapDispatchToProps
  () => ({})
)(MissionInfoLayerPresentation);

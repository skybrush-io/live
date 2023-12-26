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

import Colors from '~/components/colors';
import { setLayerParametersById } from '~/features/map/layers';
import {
  getGPSBasedHomePositionsInMission,
  getGPSBasedLandingPositionsInMission,
  getSelectedMissionIndicesForTrajectoryDisplay,
} from '~/features/mission/selectors';
import {
  getConvexHullOfShowInWorldCoordinates,
  getOutdoorShowOrientation,
  getOutdoorShowOrigin,
} from '~/features/show/selectors';
import { getSelectedUAVIdsForTrajectoryDisplay } from '~/features/uavs/selectors';
import {
  globalIdToHomePositionId,
  globalIdToLandingPositionId,
  areaIdToGlobalId,
  homePositionIdToGlobalId,
  landingPositionIdToGlobalId,
  originIdToGlobalId,
  MAP_ORIGIN_ID,
  MISSION_ORIGIN_ID,
  CONVEX_HULL_AREA_ID,
} from '~/model/identifiers';
import { setLayerEditable, setLayerSelectable } from '~/model/layers';
import { getMapOriginRotationAngle } from '~/selectors/map';
import { getSelectedOriginIds, isSelected } from '~/selectors/selection';
import { formatMissionId } from '~/utils/formatting';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import { closePolygon, toRadians } from '~/utils/math';
import CustomPropTypes from '~/utils/prop-types';
import {
  blackVeryThinOutline,
  fill,
  stroke,
  thinOutline,
  whiteThickOutline,
  whiteThinOutline,
} from '~/utils/styles';
import MissionSlotTrajectoryFeature from '~/views/map/features/MissionSlotTrajectoryFeature';
import UAVTrajectoryFeature from '~/views/map/features/UAVTrajectoryFeature';

import missionOriginMarker from '~/../assets/img/mission-origin-marker.svg';

// === Settings for this particular layer type ===

const MissionInfoLayerSettingsPresentation = ({
  layer,
  setLayerParameters,
}) => {
  const { parameters } = layer;
  const {
    showConvexHull,
    showOrigin,
    showHomePositions,
    showLandingPositions,
    showMissionOrigin,
    showTrajectoriesOfSelection,
  } = parameters || {};

  const handleChange = (name) => (event) =>
    setLayerParameters({ [name]: event.target.checked });

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
      <FormControlLabel
        control={
          <Checkbox
            checked={showConvexHull}
            value='showConvexHull'
            onChange={handleChange('showConvexHull')}
          />
        }
        label='Show convex hull of trajectories'
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={showTrajectoriesOfSelection}
            value='showTrajectoriesOfSelection'
            onChange={handleChange('showTrajectoriesOfSelection')}
          />
        }
        label='Show trajectories of selected drones'
      />
    </FormGroup>
  );
};

MissionInfoLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  setLayerParameters: PropTypes.func,
};

export const MissionInfoLayerSettings = connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    setLayerParameters(parameters) {
      dispatch(setLayerParametersById(ownProps.layerId, parameters));
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
const redLine = stroke(Colors.axes.x, 2);

/**
 * Styling for the stroke of the Y axis of the coordinate system.
 */
const greenLine = stroke(Colors.axes.y, 2);

/**
 * Fill color to use for the origin marker.
 */
const originMarkerFill = fill(Colors.markers.origin);

/**
 * Shape to use for takeoff markers.
 */
const takeoffTriangle = new RegularShape({
  fill: fill(Colors.markers.takeoff),
  points: 3,
  radius: 6,
  stroke: blackVeryThinOutline,
});

/**
 * Shape to use for landing markers.
 */
const landingMarker = new RegularShape({
  fill: fill(Colors.markers.landing),
  points: 3,
  radius: 6,
  rotation: Math.PI,
  stroke: blackVeryThinOutline,
});

/**
 * Styling function for the marker representing the origin of the map
 * coordinate system.
 */
const originStyles = (selected, axis) => [
  // Circle and label
  new Style({
    /* eslint-disable object-shorthand */
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
    /* eslint-enable object-shorthand */
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
    image: takeoffTriangle,
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
    image: landingMarker,
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

/**
 * Style for the convex hull of the mission.
 */
const baseMissionConvexHullStyle = new Style({
  stroke: thinOutline(Colors.convexHull),
});
const missionConvexHullSelectionStyle = new Style({
  stroke: whiteThickOutline,
});
const missionConvexHullStyles = [
  [baseMissionConvexHullStyle],
  [missionConvexHullSelectionStyle, baseMissionConvexHullStyle],
];

/**
 * Selector that takes the current state and returns whether the convex hull of
 * the mission is selected.
 */
const isConvexHullSelected = isSelected(areaIdToGlobalId(CONVEX_HULL_AREA_ID));

const MissionInfoVectorSource = ({
  convexHull,
  coordinateSystemType,
  homePositions,
  isConvexHullSelected,
  landingPositions,
  missionSlotIdsForTrajectories,
  missionOrientation,
  missionOrigin,
  orientation,
  origin,
  selectedOriginIds,
  uavIdsForTrajectories,
}) => {
  const features = [];

  if (Array.isArray(landingPositions)) {
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

  if (Array.isArray(homePositions)) {
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

  if (origin) {
    const globalIdOfOrigin = originIdToGlobalId(MAP_ORIGIN_ID);
    const tail = mapViewCoordinateFromLonLat(origin);
    const armLength =
      50 /* meters */ / getPointResolution('EPSG:3857', 1, tail);
    const headY = [0, coordinateSystemType === 'nwu' ? armLength : -armLength];
    const headX = [armLength, 0];
    const selected =
      selectedOriginIds.includes(MAP_ORIGIN_ID) ||
      selectedOriginIds.includes(MAP_ORIGIN_ID + '$y');
    Coordinate.rotate(headX, toRadians(90 - orientation));
    Coordinate.rotate(headY, toRadians(90 - orientation));
    Coordinate.add(headY, tail);
    Coordinate.add(headX, tail);

    features.push(
      <Feature
        key='mapOrigin.x'
        id={globalIdOfOrigin}
        style={originStyles(selected, 'x')}
      >
        <geom.LineString coordinates={[tail, headX]} />
      </Feature>,
      <Feature
        key='mapOrigin.y'
        id={globalIdOfOrigin + '$y'}
        style={originStyles(selected, 'y')}
      >
        <geom.LineString coordinates={[tail, headY]} />
      </Feature>
    );
  }

  if (missionOrigin) {
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

  if (convexHull) {
    const globalIdOfMissionConvexHull = areaIdToGlobalId(CONVEX_HULL_AREA_ID);
    const convexHullInMapCoordinates = convexHull.map((coord) =>
      mapViewCoordinateFromLonLat([coord.lon, coord.lat])
    );
    closePolygon(convexHullInMapCoordinates);

    features.push(
      <Feature
        key='missionConvexHull'
        id={globalIdOfMissionConvexHull}
        style={missionConvexHullStyles[isConvexHullSelected ? 1 : 0]}
      >
        <geom.LineString coordinates={convexHullInMapCoordinates} />
      </Feature>
    );
  }

  if (
    Array.isArray(uavIdsForTrajectories) &&
    uavIdsForTrajectories.length > 0
  ) {
    for (const uavId of uavIdsForTrajectories) {
      features.push(
        <UAVTrajectoryFeature key={`trajectory.${uavId}`} uavId={uavId} />
      );
    }
  }

  if (
    Array.isArray(missionSlotIdsForTrajectories) &&
    missionSlotIdsForTrajectories.length > 0
  ) {
    for (const missionIndex of missionSlotIdsForTrajectories) {
      features.push(
        <MissionSlotTrajectoryFeature
          key={`trajectory.s${missionIndex}`}
          missionIndex={missionIndex}
        />
      );
    }
  }

  return <source.Vector>{features}</source.Vector>;
};

MissionInfoVectorSource.propTypes = {
  convexHull: PropTypes.arrayOf(CustomPropTypes.coordinate),
  coordinateSystemType: PropTypes.oneOf(['neu', 'nwu']),
  homePositions: PropTypes.arrayOf(CustomPropTypes.coordinate),
  isConvexHullSelected: PropTypes.bool,
  landingPositions: PropTypes.arrayOf(CustomPropTypes.coordinate),
  missionSlotIdsForTrajectories: PropTypes.arrayOf(PropTypes.string),
  missionOrientation: CustomPropTypes.angle,
  missionOrigin: PropTypes.arrayOf(PropTypes.number),
  orientation: CustomPropTypes.angle,
  origin: PropTypes.arrayOf(PropTypes.number),
  selectedOriginIds: PropTypes.arrayOf(PropTypes.string),
  uavIdsForTrajectories: PropTypes.arrayOf(PropTypes.string),
};

MissionInfoVectorSource.defaultProps = {
  orientation: 0,
};

const MissionInfoLayerPresentation = ({ layer, zIndex, ...rest }) => (
  <olLayer.Vector
    ref={markAsSelectableAndEditable}
    updateWhileAnimating
    updateWhileInteracting
    zIndex={zIndex}
  >
    <MissionInfoVectorSource {...rest} />
  </olLayer.Vector>
);

MissionInfoLayerPresentation.propTypes = {
  layer: PropTypes.object,
  zIndex: PropTypes.number,
};

export const MissionInfoLayer = connect(
  // mapStateToProps
  (state, { layer }) => ({
    convexHull: layer?.parameters?.showConvexHull
      ? getConvexHullOfShowInWorldCoordinates(state)
      : undefined,
    coordinateSystemType: state.map.origin.type,
    homePositions: layer?.parameters?.showHomePositions
      ? getGPSBasedHomePositionsInMission(state)
      : undefined,
    isConvexHullSelected: isConvexHullSelected(state),
    landingPositions: layer?.parameters?.showLandingPositions
      ? getGPSBasedLandingPositionsInMission(state)
      : undefined,
    /* prettier-ignore */
    missionSlotIdsForTrajectories:
      layer?.parameters?.showTrajectoriesOfSelection
        ? getSelectedMissionIndicesForTrajectoryDisplay(state)
        : undefined,
    missionOrigin: layer?.parameters?.showMissionOrigin
      ? getOutdoorShowOrigin(state)
      : undefined,
    missionOrientation: getOutdoorShowOrientation(state),
    orientation: getMapOriginRotationAngle(state),
    origin: layer?.parameters?.showOrigin && state.map.origin.position,
    selectedOriginIds: getSelectedOriginIds(state),
    uavIdsForTrajectories: layer?.parameters?.showTrajectoriesOfSelection
      ? getSelectedUAVIdsForTrajectoryDisplay(state)
      : undefined,
  }),
  // mapDispatchToProps
  {}
)(MissionInfoLayerPresentation);

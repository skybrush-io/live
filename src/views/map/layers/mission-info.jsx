import memoizeOne from 'memoize-one';
import memoize from 'memoizee';
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
  getCurrentMissionItemIndex,
  getCurrentMissionItemRatio,
  getGPSBasedHomePositionsInMission,
  getGPSBasedLandingPositionsInMission,
  getMissionItemsWithCoordinatesInOrder,
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
  MISSION_ITEM_LINE_STRING_ID,
  MISSION_ORIGIN_ID,
  CONVEX_HULL_AREA_ID,
  missionItemIdToGlobalId,
} from '~/model/identifiers';
import { setLayerEditable, setLayerSelectable } from '~/model/layers';
import { getMapOriginRotationAngle } from '~/selectors/map';
import { getSelection } from '~/selectors/selection';
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
import mapMarker from '~/../assets/img/map-marker.svg';
import mapMarkerOutline from '~/../assets/img/map-marker-outline.svg';

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
    showMissionItems,
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
            checked={Boolean(showOrigin)}
            value='showOrigin'
            onChange={handleChange('showOrigin')}
          />
        }
        label='Show map origin'
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={Boolean(showMissionOrigin)}
            value='showMissionOrigin'
            onChange={handleChange('showMissionOrigin')}
          />
        }
        label='Show mission origin'
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={Boolean(showHomePositions)}
            value='showHomePositions'
            onChange={handleChange('showHomePositions')}
          />
        }
        label='Show home positions'
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={Boolean(showLandingPositions)}
            value='showLandingPositions'
            onChange={handleChange('showLandingPositions')}
          />
        }
        label='Show landing positions'
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={Boolean(showConvexHull)}
            value='showConvexHull'
            onChange={handleChange('showConvexHull')}
          />
        }
        label='Show convex hull of trajectories'
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={Boolean(showTrajectoriesOfSelection)}
            value='showTrajectoriesOfSelection'
            onChange={handleChange('showTrajectoriesOfSelection')}
          />
        }
        label='Show trajectories of selected drones'
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={Boolean(showMissionItems)}
            value='showMissionItems'
            onChange={handleChange('showMissionItems')}
          />
        }
        label='Show mission items'
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
 * Style for the marker representing the individual items in a waypoint mission.
 */
const createMissionItemBaseStyle = memoize(
  (current, done, selected) => (feature) => {
    const index = feature.get('index');
    const style = {
      image: new Icon({
        src: mapMarker,
        anchor: [0.5, 0.95],
        color: selected
          ? Colors.selectedMissionItem
          : done
          ? Colors.doneMissionItem
          : current
          ? Colors.currentMissionItem
          : Colors.missionItem,
        rotateWithView: false,
        snapToPixel: false,
      }),
      text: new Text({
        font: '12px sans-serif',
        offsetY: -17,
        text: index !== undefined ? String(index + 1) : '?',
        textAlign: 'center',
      }),
    };

    if (selected) {
      const selectedStyle = {
        image: new Icon({
          src: mapMarkerOutline,
          anchor: [0.5, 0.95],
          rotateWithView: false,
          snapToPixel: false,
        }),
      };
      return [new Style(selectedStyle), new Style(style)];
    } else {
      return new Style(style);
    }
  }
);

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
 * Style for the polygon connecting the mission items in a waypoint mission.
 */
const missionItemLineStringStyle = memoize((done) => [
  new Style({
    stroke: thinOutline(done ? Colors.doneMissionItem : Colors.missionItem),
  }),
]);

const CONVEX_HULL_GLOBAL_ID = areaIdToGlobalId(CONVEX_HULL_AREA_ID);
const MAP_ORIGIN_GLOBAL_ID = originIdToGlobalId(MAP_ORIGIN_ID);
// TODO: This is not an `area`, but it's global id is created using that prefix.
const MISSION_ITEM_LINE_STRING_GLOBAL_ID = areaIdToGlobalId(
  MISSION_ITEM_LINE_STRING_ID
);
const MISSION_ORIGIN_GLOBAL_ID = originIdToGlobalId(MISSION_ORIGIN_ID);

const MissionInfoVectorSource = ({
  convexHull,
  coordinateSystemType,
  currentItemIndex,
  currentItemRatio,
  homePositions,
  landingPositions,
  missionItems,
  missionOrientation,
  missionOrigin,
  missionSlotIdsForTrajectories,
  orientation,
  origin,
  selection,
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
    const tail = mapViewCoordinateFromLonLat(origin);
    const armLength =
      50 /* meters */ / getPointResolution('EPSG:3857', 1, tail);
    const headY = [0, coordinateSystemType === 'nwu' ? armLength : -armLength];
    const headX = [armLength, 0];
    const selected =
      selection.includes(MAP_ORIGIN_GLOBAL_ID) ||
      selection.includes(MAP_ORIGIN_GLOBAL_ID + '$y');
    Coordinate.rotate(headX, toRadians(90 - orientation));
    Coordinate.rotate(headY, toRadians(90 - orientation));
    Coordinate.add(headY, tail);
    Coordinate.add(headX, tail);

    features.push(
      <Feature
        key='mapOrigin.x'
        id={MAP_ORIGIN_GLOBAL_ID}
        style={originStyles(selected, 'x')}
      >
        <geom.LineString coordinates={[tail, headX]} />
      </Feature>,
      <Feature
        key='mapOrigin.y'
        id={MAP_ORIGIN_GLOBAL_ID + '$y'}
        style={originStyles(selected, 'y')}
      >
        <geom.LineString coordinates={[tail, headY]} />
      </Feature>
    );
  }

  if (missionItems) {
    // Add one marker for each item in the mission
    features.push(
      ...missionItems.map(({ index, id, coordinate }) => {
        const current = index === currentItemIndex;
        const done =
          index < currentItemIndex ||
          (index === currentItemIndex && currentItemRatio === 1);
        const globalIdOfMissionItem = missionItemIdToGlobalId(id);
        const selected = selection.includes(globalIdOfMissionItem);
        const center = mapViewCoordinateFromLonLat([
          coordinate.lon,
          coordinate.lat,
        ]);
        return (
          <Feature
            key={globalIdOfMissionItem}
            id={globalIdOfMissionItem}
            properties={{ index }}
            style={createMissionItemBaseStyle(current, done, selected)}
          >
            <geom.Point coordinates={center} />
          </Feature>
        );
      })
    );

    const splitPoint = missionItems.findIndex(
      (mi) => mi.index >= currentItemIndex
    );
    const doneMissionItems = missionItems.slice(0, splitPoint);
    const todoMissionItems = missionItems.slice(splitPoint);

    // If there are at least two items with coordinates, connect them with a
    // polyline.
    if (doneMissionItems.length + todoMissionItems.length > 1) {
      const doneMissionItemsInMapCoordinates = doneMissionItems.map(
        ({ coordinate }) =>
          mapViewCoordinateFromLonLat([coordinate.lon, coordinate.lat])
      );
      const todoMissionItemsInMapCoordinates = todoMissionItems.map(
        ({ coordinate }) =>
          mapViewCoordinateFromLonLat([coordinate.lon, coordinate.lat])
      );

      if (
        doneMissionItems.length > 0 &&
        todoMissionItems.length > 0 &&
        currentItemRatio !== undefined
      ) {
        const lastDone = doneMissionItemsInMapCoordinates.at(-1);
        const firstTodo = todoMissionItemsInMapCoordinates.at(0);

        const splitPoint = [
          lastDone[0] * (1 - currentItemRatio) +
            firstTodo[0] * currentItemRatio,
          lastDone[1] * (1 - currentItemRatio) +
            firstTodo[1] * currentItemRatio,
        ];

        doneMissionItemsInMapCoordinates.push(splitPoint);
        todoMissionItemsInMapCoordinates.unshift(splitPoint);
      }

      features.push(
        <Feature
          key='doneMissionItemLineString'
          id={`${MISSION_ITEM_LINE_STRING_GLOBAL_ID}Done`}
          style={missionItemLineStringStyle(true)}
        >
          <geom.LineString coordinates={doneMissionItemsInMapCoordinates} />
        </Feature>,
        <Feature
          key='todoMissionItemLineString'
          id={`${MISSION_ITEM_LINE_STRING_GLOBAL_ID}Todo`}
          style={missionItemLineStringStyle(false)}
        >
          <geom.LineString coordinates={todoMissionItemsInMapCoordinates} />
        </Feature>
      );
    }
  }

  if (missionOrigin) {
    const missionOriginCoord = mapViewCoordinateFromLonLat(missionOrigin);
    features.push(
      <Feature
        key='missionOrigin'
        id={MISSION_ORIGIN_GLOBAL_ID}
        style={createMissionOriginStyle(missionOrientation)}
      >
        <geom.Point coordinates={missionOriginCoord} />
      </Feature>
    );
  }

  if (convexHull) {
    const convexHullInMapCoordinates = convexHull.map((coord) =>
      mapViewCoordinateFromLonLat([coord.lon, coord.lat])
    );
    closePolygon(convexHullInMapCoordinates);

    features.push(
      <Feature
        key='missionConvexHull'
        id={CONVEX_HULL_GLOBAL_ID}
        style={
          missionConvexHullStyles[
            selection.includes(CONVEX_HULL_GLOBAL_ID) ? 1 : 0
          ]
        }
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
  currentItemIndex: PropTypes.number,
  currentItemRatio: PropTypes.number,
  homePositions: PropTypes.arrayOf(CustomPropTypes.coordinate),
  landingPositions: PropTypes.arrayOf(CustomPropTypes.coordinate),
  missionItems: PropTypes.arrayOf(PropTypes.object),
  missionOrientation: CustomPropTypes.angle,
  missionOrigin: PropTypes.arrayOf(PropTypes.number),
  missionSlotIdsForTrajectories: PropTypes.arrayOf(PropTypes.string),
  orientation: CustomPropTypes.angle,
  origin: PropTypes.arrayOf(PropTypes.number),
  selection: PropTypes.arrayOf(PropTypes.string),
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
    currentItemIndex: getCurrentMissionItemIndex(state),
    currentItemRatio: getCurrentMissionItemRatio(state) ?? 0,
    homePositions: layer?.parameters?.showHomePositions
      ? getGPSBasedHomePositionsInMission(state)
      : undefined,
    landingPositions: layer?.parameters?.showLandingPositions
      ? getGPSBasedLandingPositionsInMission(state)
      : undefined,
    missionItems: layer?.parameters?.showMissionItems
      ? getMissionItemsWithCoordinatesInOrder(state)
      : undefined,
    missionOrigin: layer?.parameters?.showMissionOrigin
      ? getOutdoorShowOrigin(state)
      : undefined,
    missionOrientation: getOutdoorShowOrientation(state),
    /* prettier-ignore */
    missionSlotIdsForTrajectories:
      layer?.parameters?.showTrajectoriesOfSelection
        ? getSelectedMissionIndicesForTrajectoryDisplay(state)
        : undefined,
    orientation: getMapOriginRotationAngle(state),
    origin: layer?.parameters?.showOrigin && state.map.origin.position,
    selection: getSelection(state),
    uavIdsForTrajectories: layer?.parameters?.showTrajectoriesOfSelection
      ? getSelectedUAVIdsForTrajectoryDisplay(state)
      : undefined,
  }),
  // mapDispatchToProps
  {}
)(MissionInfoLayerPresentation);

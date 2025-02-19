import dropWhile from 'lodash-es/dropWhile';
import takeWhile from 'lodash-es/takeWhile';
import unary from 'lodash-es/unary';
import memoizeOne from 'memoize-one';
import memoize from 'memoizee';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import * as Coordinate from 'ol/coordinate';
import Point from 'ol/geom/Point';
import { getPointResolution } from 'ol/proj';
import { Circle, Icon, Style, Text } from 'ol/style';

import { Feature, geom, layer as olLayer, source } from '@collmot/ol-react';

import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';

import Colors from '~/components/colors';
import {
  convexHullPolygon,
  homePositionPoints,
  landingPositionPoints,
} from '~/components/map/layers/ShowInfoLayer';
import { Tool } from '~/components/map/tools';
import { setLayerParametersById } from '~/features/map/layers';
import {
  getCurrentMissionItemIndex,
  getCurrentMissionItemRatio,
  getGPSBasedHomePositionsInMission,
  getGPSBasedLandingPositionsInMission,
  getMissionItemsOfTypeWithIndices,
  getMissionItemsWithAreasInOrder,
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
  MAP_ORIGIN_ID,
  MISSION_ITEM_LINE_STRING_ID,
  MISSION_ORIGIN_ID,
  missionItemIdToGlobalId,
  originIdToGlobalId,
  plannedTrajectoryIdToGlobalId,
} from '~/model/identifiers';
import { setLayerEditable, setLayerSelectable } from '~/model/layers';
import { MissionItemType } from '~/model/missions';
import { getMapOriginRotationAngle } from '~/selectors/map';
import { getSelection } from '~/selectors/selection';
import { hasFeature } from '~/utils/configuration';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import { closePolygon, toRadians } from '~/utils/math';
import CustomPropTypes from '~/utils/prop-types';
import {
  dashedThinOutline,
  dottedThickOutline,
  fill,
  lineStringArrow,
  stroke,
  thickOutline,
  thinOutline,
  whiteThickOutline,
  whiteThinOutline,
} from '~/utils/styles';
import MissionSlotTrajectoryFeature from '~/views/map/features/MissionSlotTrajectoryFeature';
import UAVTrajectoryFeature from '~/views/map/features/UAVTrajectoryFeature';

import { styleForPointsOfPolygon } from './features';

import mapMarkerOutline from '~/../assets/img/map-marker-outline.svg';
import mapMarker from '~/../assets/img/map-marker.svg';
import missionOriginMarkerIcon from '~/../assets/img/mission-origin-marker.svg';

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
      {hasFeature('showControl') && (
        <>
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
        </>
      )}
      {hasFeature('missionEditor') && (
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
      )}
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
        src: missionOriginMarkerIcon,
        rotateWithView: true,
        rotation: toRadians(heading),
        snapToPixel: false,
      }),
    })
);

/**
 * Style for the flight area of the mission.
 */
const missionFlightAreaBaseStyle = new Style({
  stroke: dashedThinOutline(Colors.flightArea),
});
const missionFlightAreaSelectionStyle = new Style({
  stroke: whiteThinOutline,
});
const missionFlightAreaEditStyle = (selected) =>
  styleForPointsOfPolygon(selected, Colors.flightArea);

/**
 * Styles for the linestrings connecting the mission items in a waypoint
 * mission to show the expected trajectory.
 */
const doneMissionItemLineStringStyle = new Style({
  stroke: thickOutline(Colors.doneMissionItem),
});
const todoMissionItemLineStringStyle = new Style({
  stroke: thinOutline(Colors.missionItem),
});
const auxiliaryMissionItemLineStringStyle = (feature) => [
  new Style({
    stroke: dottedThickOutline(Colors.auxiliaryMissionItem),
  }),
  lineStringArrow(Colors.auxiliaryMissionItem, 'start')(feature),
  lineStringArrow(Colors.auxiliaryMissionItem, 'end')(feature),
];

/**
 * Global identifiers for certain mission-specific features.
 */
const MAP_ORIGIN_GLOBAL_ID = originIdToGlobalId(MAP_ORIGIN_ID);
const MISSION_ITEM_LINE_STRING_GLOBAL_ID = plannedTrajectoryIdToGlobalId(
  MISSION_ITEM_LINE_STRING_ID
);
const MISSION_ORIGIN_GLOBAL_ID = originIdToGlobalId(MISSION_ORIGIN_ID);

const mapOriginMarker = (
  coordinateSystemType,
  mapOrigin,
  orientation,
  selection
) => {
  if (mapOrigin) {
    const tail = mapViewCoordinateFromLonLat(mapOrigin);
    const armLength =
      50 /* meters */ / getPointResolution('EPSG:3857', 1, tail);
    const headY = [0, coordinateSystemType === 'nwu' ? armLength : -armLength];
    const headX = [armLength, 0];
    const selected =
      selection.includes(MAP_ORIGIN_GLOBAL_ID + '$x') ||
      selection.includes(MAP_ORIGIN_GLOBAL_ID + '$y');
    Coordinate.rotate(headX, toRadians(90 - orientation));
    Coordinate.rotate(headY, toRadians(90 - orientation));
    Coordinate.add(headY, tail);
    Coordinate.add(headX, tail);

    return [
      <Feature
        key='mapOrigin.x'
        id={MAP_ORIGIN_GLOBAL_ID + '$x'}
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
      </Feature>,
    ];
  } else {
    return [];
  }
};

const missionAreaBoundaries = (
  missionItemsWithAreas,
  selection,
  selectedTool
) =>
  missionItemsWithAreas?.map(({ id, area }) => {
    const areaBoundaryInMapCoordinates = area?.points?.map(
      unary(mapViewCoordinateFromLonLat)
    );
    closePolygon(areaBoundaryInMapCoordinates);

    const globalIdOfMissionItem = missionItemIdToGlobalId(id);
    const selected = selection.includes(globalIdOfMissionItem);

    return (
      <Feature
        key='missionFlightArea'
        id={globalIdOfMissionItem}
        style={[
          ...(selected ? [missionFlightAreaSelectionStyle] : []),
          missionFlightAreaBaseStyle,
          ...(selectedTool === Tool.EDIT_FEATURE
            ? [missionFlightAreaEditStyle(selected)]
            : []),
        ]}
      >
        <geom.Polygon coordinates={areaBoundaryInMapCoordinates} />
      </Feature>
    );
  }) ?? [];

const missionWaypointMarkers = (
  currentItemIndex,
  currentItemRatio,
  missionItemsWithCoordinates,
  selection
) =>
  missionItemsWithCoordinates
    ? missionItemsWithCoordinates.map(({ index, id, coordinate }) => {
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
    : [];

const missionTrajectoryLine = (
  currentItemIndex,
  currentItemRatio,
  missionItemsWithCoordinates
) => {
  if (missionItemsWithCoordinates) {
    // This should be done like below but lodash doesn't have `span`
    // `const [done, todo] = span(missionItemsWithCoordinates, isDone)`,
    const isDone = (mi) => mi.index < currentItemIndex;
    const doneMissionItems = takeWhile(missionItemsWithCoordinates, isDone);
    const todoMissionItems = dropWhile(missionItemsWithCoordinates, isDone);

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

      // There are already some completed items, but there are still more left
      // to be done, so a split point needs to be inserted.
      if (doneMissionItems.length > 0 && todoMissionItems.length > 0) {
        const ratio =
          (todoMissionItems[0].index === currentItemIndex
            ? // If the ratio information belongs to the next mission item with
              // coordinates
              currentItemRatio
            : // If the ratio information belongs to a mission item without
              // coordinates
              0) ?? 0;

        const lastDone = doneMissionItemsInMapCoordinates.at(-1);
        const firstTodo = todoMissionItemsInMapCoordinates.at(0);

        const splitPoint = [
          lastDone[0] * (1 - ratio) + firstTodo[0] * ratio,
          lastDone[1] * (1 - ratio) + firstTodo[1] * ratio,
        ];

        doneMissionItemsInMapCoordinates.push(splitPoint);
        todoMissionItemsInMapCoordinates.unshift(splitPoint);
      }

      return [
        <Feature
          key='doneMissionItemLineString'
          id={`${MISSION_ITEM_LINE_STRING_GLOBAL_ID}Done`}
          style={doneMissionItemLineStringStyle}
        >
          <geom.LineString coordinates={doneMissionItemsInMapCoordinates} />
        </Feature>,
        <Feature
          key='todoMissionItemLineString'
          id={`${MISSION_ITEM_LINE_STRING_GLOBAL_ID}Todo`}
          style={todoMissionItemLineStringStyle}
        >
          <geom.LineString coordinates={todoMissionItemsInMapCoordinates} />
        </Feature>,
      ];
    }
  } else {
    return [];
  }
};

const auxiliaryMissionLines = (
  homePositions,
  missionItemsWithCoordinates,
  returnToHomeItems
) => {
  if (homePositions?.[0] && missionItemsWithCoordinates?.length > 0) {
    const findSurroundingWaypoints = (current) => ({
      before: missionItemsWithCoordinates.findLast((mi) => mi.index < current),
      after: missionItemsWithCoordinates.find((mi) => mi.index > current),
    });

    const makeFeature = (id, key, from, to) => (
      <Feature key={key} id={id} style={auxiliaryMissionItemLineStringStyle}>
        <geom.LineString
          coordinates={[
            mapViewCoordinateFromLonLat([from.lon, from.lat]),
            mapViewCoordinateFromLonLat([to.lon, to.lat]),
          ]}
        />
      </Feature>
    );

    const makeFeatures = ({ id, index }) => {
      const { before, after } = findSurroundingWaypoints(index);
      return [
        ...(before
          ? [
              makeFeature(
                `auxiliaryMissionLineString_${id}_before`,
                `${MISSION_ITEM_LINE_STRING_GLOBAL_ID}Aux_${id}_before`,
                before.coordinate,
                homePositions[0]
              ),
            ]
          : []),
        ...(after
          ? [
              makeFeature(
                `auxiliaryMissionLineString_${id}_after`,
                `${MISSION_ITEM_LINE_STRING_GLOBAL_ID}Aux_${id}_after`,
                homePositions[0],
                after.coordinate
              ),
            ]
          : []),
      ];
    };

    return [
      // Extend the array with an extra item at the beginning in order to also
      // show a line connecting the home point to the first waypoint, as there
      // is no "Return to home" mission item at the beginning of missions.
      { id: 'start', index: -1 },
      ...returnToHomeItems.map(({ index, item: { id } }) => ({ id, index })),
    ].flatMap(makeFeatures);
  } else {
    return [];
  }
};

const missionOriginMarker = (missionOrientation, missionOrigin) =>
  missionOrigin
    ? [
        <Feature
          key='missionOrigin'
          id={MISSION_ORIGIN_GLOBAL_ID}
          properties={{ skipSelection: true }}
          style={createMissionOriginStyle(missionOrientation)}
        >
          <geom.Point
            coordinates={mapViewCoordinateFromLonLat(missionOrigin)}
          />
        </Feature>,
      ]
    : [];

const selectionTrajectoryFeatures = (
  missionIndicesForTrajectories,
  uavIdsForTrajectories
) => {
  const trajectoryFeatures = [];

  if (
    Array.isArray(uavIdsForTrajectories) &&
    uavIdsForTrajectories.length > 0
  ) {
    for (const uavId of uavIdsForTrajectories) {
      trajectoryFeatures.push(
        <UAVTrajectoryFeature key={`trajectory.${uavId}`} uavId={uavId} />
      );
    }
  }

  if (
    Array.isArray(missionIndicesForTrajectories) &&
    missionIndicesForTrajectories.length > 0
  ) {
    for (const missionIndex of missionIndicesForTrajectories) {
      trajectoryFeatures.push(
        <MissionSlotTrajectoryFeature
          key={`trajectory.s${missionIndex}`}
          missionIndex={missionIndex}
        />
      );
    }
  }

  return trajectoryFeatures;
};

const MissionInfoVectorSource = ({
  convexHull,
  coordinateSystemType,
  currentItemIndex,
  currentItemRatio,
  homePositions,
  landingPositions,
  mapOrigin,
  missionItemsWithAreas,
  missionItemsWithCoordinates,
  missionOrientation,
  missionOrigin,
  missionIndicesForTrajectories,
  orientation,
  returnToHomeItems,
  selectedTool,
  selection,
  uavIdsForTrajectories,
}) => (
  <source.Vector>
    {[].concat(
      landingPositionPoints(landingPositions),
      homePositionPoints(homePositions),
      mapOriginMarker(coordinateSystemType, mapOrigin, orientation, selection),
      missionAreaBoundaries(missionItemsWithAreas, selection, selectedTool),
      missionWaypointMarkers(
        currentItemIndex,
        currentItemRatio,
        missionItemsWithCoordinates,
        selection
      ),
      missionTrajectoryLine(
        currentItemIndex,
        currentItemRatio,
        missionItemsWithCoordinates
      ),
      auxiliaryMissionLines(
        homePositions,
        missionItemsWithCoordinates,
        returnToHomeItems
      ),
      missionOriginMarker(missionOrientation, missionOrigin),
      convexHullPolygon(convexHull, selection),
      selectionTrajectoryFeatures(
        missionIndicesForTrajectories,
        uavIdsForTrajectories
      )
    )}
  </source.Vector>
);

MissionInfoVectorSource.propTypes = {
  convexHull: PropTypes.arrayOf(CustomPropTypes.coordinate),
  coordinateSystemType: PropTypes.oneOf(['neu', 'nwu']),
  currentItemIndex: PropTypes.number,
  currentItemRatio: PropTypes.number,
  homePositions: PropTypes.arrayOf(CustomPropTypes.coordinate),
  landingPositions: PropTypes.arrayOf(CustomPropTypes.coordinate),
  mapOrigin: PropTypes.arrayOf(PropTypes.number),
  missionItemsWithAreas: PropTypes.arrayOf(PropTypes.object),
  missionItemsWithCoordinates: PropTypes.arrayOf(PropTypes.object),
  missionOrientation: CustomPropTypes.angle,
  missionOrigin: PropTypes.arrayOf(PropTypes.number),
  missionIndicesForTrajectories: PropTypes.arrayOf(PropTypes.number),
  orientation: CustomPropTypes.angle,
  returnToHomeItems: PropTypes.arrayOf(PropTypes.object),
  selectedTool: PropTypes.string,
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
    currentItemRatio: getCurrentMissionItemRatio(state),
    homePositions: layer?.parameters?.showHomePositions
      ? getGPSBasedHomePositionsInMission(state)
      : undefined,
    landingPositions: layer?.parameters?.showLandingPositions
      ? getGPSBasedLandingPositionsInMission(state)
      : undefined,
    mapOrigin: layer?.parameters?.showOrigin && state.map.origin.position,
    missionItemsWithAreas: layer?.parameters?.showMissionItems
      ? getMissionItemsWithAreasInOrder(state)
      : undefined,
    missionItemsWithCoordinates: layer?.parameters?.showMissionItems
      ? getMissionItemsWithCoordinatesInOrder(state)
      : undefined,
    missionOrigin: layer?.parameters?.showMissionOrigin
      ? getOutdoorShowOrigin(state)
      : undefined,
    missionOrientation: getOutdoorShowOrientation(state),
    /* prettier-ignore */
    missionIndicesForTrajectories:
      layer?.parameters?.showTrajectoriesOfSelection
        ? getSelectedMissionIndicesForTrajectoryDisplay(state)
        : undefined,
    orientation: getMapOriginRotationAngle(state),
    returnToHomeItems: getMissionItemsOfTypeWithIndices(
      state,
      MissionItemType.RETURN_TO_HOME
    ),
    selection: getSelection(state),
    uavIdsForTrajectories: layer?.parameters?.showTrajectoriesOfSelection
      ? getSelectedUAVIdsForTrajectoryDisplay(state)
      : undefined,
  }),
  // mapDispatchToProps
  {}
)(MissionInfoLayerPresentation);

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import dropWhile from 'lodash-es/dropWhile';
import takeWhile from 'lodash-es/takeWhile';
import unary from 'lodash-es/unary';
import memoize from 'memoizee';
import * as Coordinate from 'ol/coordinate';
import Point from 'ol/geom/Point';
import { getPointResolution } from 'ol/proj';
import { Circle, Icon, Style, Text } from 'ol/style';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { Feature, geom, layer as olLayer, source } from '@collmot/ol-react';
import { closePolygon, toRadians } from '@skybrush/math';

import mapMarkerOutline from '~/../assets/img/map-marker-outline.svg';
import mapMarker from '~/../assets/img/map-marker.svg';
import Colors from '~/components/colors';
import { styleForPointsOfPolygon } from '~/components/map/layers/features';
import {
  convexHullPolygon,
  ConvexHullVariant,
  homePositionPoints,
  landingPositionPoints,
  orientationMarker,
  TAKEOFF_LANDING_POSITION_CHARACTER_WIDTH,
} from '~/components/map/layers/ShowInfoLayer';
import { markAsSelectableAndEditable } from '~/components/map/layers/utils';
import { Tool } from '~/components/map/tools';
import { setLayerParametersById } from '~/features/map/layers';
import {
  getCompletionRatiosForMissionItemById,
  getCurrentMissionItemIndexForEveryMissionIndex,
  getCurrentMissionItemRatioForEveryMissionIndex,
  getGPSBasedHomePositionsInMission,
  getGPSBasedLandingPositionsInMission,
  getMinimumDistanceBetweenHomePositions,
  getMinimumDistanceBetweenLandingPositions,
  getMissionItemsOfTypeWithIndices,
  getMissionItemsWithAreasInOrder,
  getMissionItemsWithCoordinatesInOrder,
  getMissionMapping,
  getSelectedMissionIndicesForTrajectoryDisplay,
} from '~/features/mission/selectors';
import { doesMissionIndexParticipateInMissionItem } from '~/features/mission/utils';
import { getVirtualSelection } from '~/features/selection/selectors';
import {
  getConvexHullOfShowInWorldCoordinates,
  getOutdoorShowOrientation,
  getOutdoorShowOrigin,
} from '~/features/show/selectors';
import { getSelectedUAVIdsForTrajectoryDisplay } from '~/features/uavs/selectors';
import {
  MAP_ORIGIN_ID,
  MISSION_ORIGIN_ID,
  missionItemIdToGlobalId,
  originIdToGlobalId,
  plannedTrajectoryIdToGlobalId,
} from '~/model/identifiers';
import { MissionItemType } from '~/model/missions';
import { getMapOriginRotationAngle } from '~/selectors/map';
import { hasFeature } from '~/utils/configuration';
import { formatMissionId } from '~/utils/formatting';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
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

// === Settings for this particular layer type ===

const MissionInfoLayerSettingsPresentation = ({
  layer,
  setLayerParameters,
}) => {
  const { t } = useTranslation(undefined, {
    keyPrefix: 'MissionInfoLayer.settings',
  });
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
        label={t('showMapOrigin')}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={Boolean(showMissionOrigin)}
            value='showMissionOrigin'
            onChange={handleChange('showMissionOrigin')}
          />
        }
        label={t('showMissionOrigin')}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={Boolean(showHomePositions)}
            value='showHomePositions'
            onChange={handleChange('showHomePositions')}
          />
        }
        label={t('showHomePositions')}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={Boolean(showLandingPositions)}
            value='showLandingPositions'
            onChange={handleChange('showLandingPositions')}
          />
        }
        label={t('showLandingPositions')}
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
            label={t('showConvexHull')}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(showTrajectoriesOfSelection)}
                value='showTrajectoriesOfSelection'
                onChange={handleChange('showTrajectoriesOfSelection')}
              />
            }
            label={t('showTrajectoriesOfSelection')}
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
          label={t('showMissionItems')}
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
        // prettier-ignore
        color:
          selected ? Colors.selectedMissionItem :
          done     ? Colors.doneMissionItem     :
          current  ? Colors.currentMissionItem  :
                     Colors.missionItem,
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
const MISSION_ORIGIN_GLOBAL_ID = originIdToGlobalId(MISSION_ORIGIN_ID);

const featureKeyForRoleAndMissionIndex = (role, index) => `${role}.${index}`;

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

const WaypointMarkerPresentation = ({
  center,
  globalId,
  index,
  ratios,
  selected,
  ...rest
}) => (
  <Feature
    id={globalId}
    properties={{ index }}
    style={createMissionItemBaseStyle(
      ratios.max > 0 && ratios.min < 1,
      ratios.min === 1,
      selected
    )}
    {...rest}
  >
    <geom.Point coordinates={center} />
  </Feature>
);

WaypointMarkerPresentation.propTypes = {
  center: PropTypes.arrayOf(PropTypes.number),
  globalId: PropTypes.string,
  index: PropTypes.number,
  ratios: PropTypes.shape({
    avg: PropTypes.number,
    max: PropTypes.number,
    min: PropTypes.number,
  }),
  selected: PropTypes.bool,
};

const WaypointMarker = connect(
  // mapStateToProps
  (state, ownProps) => ({
    ratios: getCompletionRatiosForMissionItemById(state, ownProps.itemId),
  })
)(WaypointMarkerPresentation);

const missionWaypointMarkers = (missionItemsWithCoordinates, selection) =>
  missionItemsWithCoordinates
    ? missionItemsWithCoordinates.map(({ index, id, coordinate }) => {
        const globalIdOfMissionItem = missionItemIdToGlobalId(id);
        const selected = selection.includes(globalIdOfMissionItem);
        const center = mapViewCoordinateFromLonLat([
          coordinate.lon,
          coordinate.lat,
        ]);
        return (
          <WaypointMarker
            key={globalIdOfMissionItem}
            center={center}
            globalId={globalIdOfMissionItem}
            index={index}
            itemId={id}
            selected={selected}
          />
        );
      })
    : [];

const missionTrajectoryLine = (
  currentItemIndices,
  currentItemRatios,
  allMissionItemsWithCoordinates,
  missionMapping
) => {
  if (allMissionItemsWithCoordinates) {
    return missionMapping.flatMap((_, missionIndex) => {
      const missionItemsWithCoordinates = allMissionItemsWithCoordinates.filter(
        ({ item }) =>
          doesMissionIndexParticipateInMissionItem(missionIndex)(item)
      );
      const currentItemIndex = currentItemIndices[missionIndex];
      const currentItemRatio = currentItemRatios[missionIndex];

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
            key={featureKeyForRoleAndMissionIndex('done', missionIndex)}
            id={plannedTrajectoryIdToGlobalId(`${missionIndex}$done`)}
            style={doneMissionItemLineStringStyle}
          >
            <geom.LineString coordinates={doneMissionItemsInMapCoordinates} />
          </Feature>,
          <Feature
            key={featureKeyForRoleAndMissionIndex('todo', missionIndex)}
            id={plannedTrajectoryIdToGlobalId(`${missionIndex}$todo`)}
            style={todoMissionItemLineStringStyle}
          >
            <geom.LineString coordinates={todoMissionItemsInMapCoordinates} />
          </Feature>,
        ];
      } else {
        return [];
      }
    });
  } else {
    return [];
  }
};

const auxiliaryMissionLines = (
  homePositions,
  allMissionItemsWithCoordinates,
  missionMapping,
  returnToHomeItems
) => {
  if (allMissionItemsWithCoordinates) {
    return missionMapping.flatMap((_, missionIndex) => {
      const missionItemsWithCoordinates = allMissionItemsWithCoordinates.filter(
        ({ item }) =>
          doesMissionIndexParticipateInMissionItem(missionIndex)(item)
      );
      if (
        homePositions?.[missionIndex] &&
        missionItemsWithCoordinates?.length > 0
      ) {
        const findSurroundingWaypoints = (current) => ({
          before: missionItemsWithCoordinates.findLast(
            (mi) => mi.index < current
          ),
          after: missionItemsWithCoordinates.find((mi) => mi.index > current),
        });

        const makeFeature = (id, key, from, to) => (
          <Feature
            key={key}
            id={id}
            style={auxiliaryMissionItemLineStringStyle}
          >
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
                    featureKeyForRoleAndMissionIndex(
                      `${id}.before`,
                      missionIndex
                    ),
                    plannedTrajectoryIdToGlobalId(
                      `${id}$before$${missionIndex}`
                    ),
                    before.coordinate,
                    homePositions[missionIndex]
                  ),
                ]
              : []),
            ...(after
              ? [
                  makeFeature(
                    featureKeyForRoleAndMissionIndex(
                      `${id}.after`,
                      missionIndex
                    ),
                    plannedTrajectoryIdToGlobalId(
                      `${id}$after$${missionIndex}`
                    ),
                    homePositions[missionIndex],
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
          ...returnToHomeItems.map(({ index, item: { id } }) => ({
            id,
            index,
          })),
        ].flatMap(makeFeatures);
      } else {
        return [];
      }
    });
  } else {
    return [];
  }
};

const missionOriginMarker = (missionOrientation, missionOrigin) =>
  missionOrigin
    ? [
        orientationMarker(
          missionOrientation,
          missionOrigin,
          MISSION_ORIGIN_GLOBAL_ID,
          Colors.grossShowConvexHull
        ),
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
  currentItemIndices,
  currentItemRatios,
  homePositions,
  landingPositions,
  mapOrigin,
  minimumDistanceBetweenHomePositions,
  minimumDistanceBetweenLandingPositions,
  missionItemsWithAreas,
  missionItemsWithCoordinates,
  missionMapping,
  missionOrientation,
  missionOrigin,
  missionIndicesForTrajectories,
  orientation = 0,
  returnToHomeItems,
  selectedTool,
  selection,
  uavIdsForTrajectories,
}) => (
  <source.Vector>
    {[].concat(
      homePositionPoints(homePositions, {
        minimumDistanceBetweenPositions: minimumDistanceBetweenHomePositions,
        estimatedLabelWidth: homePositions
          ? formatMissionId(homePositions.length - 1).length *
            TAKEOFF_LANDING_POSITION_CHARACTER_WIDTH
          : 0,
        selection,
      }),
      landingPositionPoints(landingPositions, {
        minimumDistanceBetweenPositions: minimumDistanceBetweenLandingPositions,
        estimatedLabelWidth: landingPositions
          ? formatMissionId(landingPositions.length - 1).length *
            TAKEOFF_LANDING_POSITION_CHARACTER_WIDTH
          : 0,
      }),
      mapOriginMarker(coordinateSystemType, mapOrigin, orientation, selection),
      missionAreaBoundaries(missionItemsWithAreas, selection, selectedTool),
      missionWaypointMarkers(missionItemsWithCoordinates, selection),
      missionTrajectoryLine(
        currentItemIndices,
        currentItemRatios,
        missionItemsWithCoordinates,
        missionMapping
      ),
      auxiliaryMissionLines(
        homePositions,
        missionItemsWithCoordinates,
        missionMapping,
        returnToHomeItems
      ),
      missionOriginMarker(missionOrientation, missionOrigin),
      convexHullPolygon(convexHull, selection, ConvexHullVariant.GROSS),
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
  currentItemIndices: PropTypes.arrayOf(PropTypes.number),
  currentItemRatios: PropTypes.arrayOf(PropTypes.number),
  homePositions: PropTypes.arrayOf(CustomPropTypes.coordinate),
  landingPositions: PropTypes.arrayOf(CustomPropTypes.coordinate),
  mapOrigin: PropTypes.arrayOf(PropTypes.number),
  minimumDistanceBetweenLandingPositions: PropTypes.number,
  minimumDistanceBetweenHomePositions: PropTypes.number,
  missionItemsWithAreas: PropTypes.arrayOf(PropTypes.object),
  missionItemsWithCoordinates: PropTypes.arrayOf(PropTypes.object),
  missionMapping: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])])
  ),
  missionOrientation: CustomPropTypes.angle,
  missionOrigin: PropTypes.arrayOf(PropTypes.number),
  missionIndicesForTrajectories: PropTypes.arrayOf(PropTypes.number),
  orientation: CustomPropTypes.angle,
  returnToHomeItems: PropTypes.arrayOf(PropTypes.object),
  selectedTool: PropTypes.string,
  selection: PropTypes.arrayOf(PropTypes.string),
  uavIdsForTrajectories: PropTypes.arrayOf(PropTypes.string),
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
    currentItemIndices: getCurrentMissionItemIndexForEveryMissionIndex(state),
    currentItemRatios: getCurrentMissionItemRatioForEveryMissionIndex(state),
    homePositions: layer?.parameters?.showHomePositions
      ? getGPSBasedHomePositionsInMission(state)
      : undefined,
    landingPositions: layer?.parameters?.showLandingPositions
      ? getGPSBasedLandingPositionsInMission(state)
      : undefined,
    mapOrigin: layer?.parameters?.showOrigin && state.map.origin.position,
    minimumDistanceBetweenLandingPositions:
      getMinimumDistanceBetweenLandingPositions(state),
    minimumDistanceBetweenHomePositions:
      getMinimumDistanceBetweenHomePositions(state),
    missionItemsWithAreas: layer?.parameters?.showMissionItems
      ? getMissionItemsWithAreasInOrder(state)
      : undefined,
    missionItemsWithCoordinates: layer?.parameters?.showMissionItems
      ? getMissionItemsWithCoordinatesInOrder(state)
      : undefined,
    missionMapping: getMissionMapping(state),
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
    selection: getVirtualSelection(state),
    uavIdsForTrajectories: layer?.parameters?.showTrajectoriesOfSelection
      ? getSelectedUAVIdsForTrajectoryDisplay(state)
      : undefined,
  }),
  // mapDispatchToProps
  {}
)(MissionInfoLayerPresentation);

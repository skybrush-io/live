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
import { Circle, Icon, RegularShape, Style, Text } from 'ol/style';

import { Feature, geom, layer as olLayer, source } from '@collmot/ol-react';

import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';

import Colors from '~/components/colors';
import { setLayerParametersById } from '~/features/map/layers';
import {
  getCompletionRatiosForMissionItemById,
  getCurrentMissionItemIndexForEveryMissionIndex,
  getCurrentMissionItemRatioForEveryMissionIndex,
  getGPSBasedHomePositionsInMission,
  getGPSBasedLandingPositionsInMission,
  getMissionItemsOfTypeWithIndices,
  getMissionItemsWithAreasInOrder,
  getMissionItemsWithCoordinatesInOrder,
  getMissionMapping,
  getSelectedMissionIdInMissionEditorPanel,
  getSelectedMissionIndicesForTrajectoryDisplay,
} from '~/features/mission/selectors';
import { doesMissionIndexParticipateInMissionItem } from '~/features/mission/utils';
import {
  getConvexHullOfShowInWorldCoordinates,
  getOutdoorShowOrientation,
  getOutdoorShowOrigin,
} from '~/features/show/selectors';
import { getSelectedUAVIdsForTrajectoryDisplay } from '~/features/uavs/selectors';
import {
  areaIdToGlobalId,
  CONVEX_HULL_AREA_ID,
  globalIdToHomePositionId,
  globalIdToLandingPositionId,
  homePositionIdToGlobalId,
  landingPositionIdToGlobalId,
  MAP_ORIGIN_ID,
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
import { formatMissionId } from '~/utils/formatting';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import { closePolygon, toRadians } from '~/utils/math';
import CustomPropTypes from '~/utils/prop-types';
import {
  blackVeryThinOutline,
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

import { Tool } from '../tools';

import { styleForPointsOfPolygon } from './features';

import mapMarker from '~/../assets/img/map-marker.svg';
import mapMarkerOutline from '~/../assets/img/map-marker-outline.svg';
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
 * Style for the convex hull of the mission.
 */
const missionConvexHullBaseStyle = new Style({
  stroke: thinOutline(Colors.convexHull),
});
const missionConvexHullSelectionStyle = new Style({
  stroke: whiteThickOutline,
});

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
const CONVEX_HULL_GLOBAL_ID = areaIdToGlobalId(CONVEX_HULL_AREA_ID);
const MAP_ORIGIN_GLOBAL_ID = originIdToGlobalId(MAP_ORIGIN_ID);
const MISSION_ORIGIN_GLOBAL_ID = originIdToGlobalId(MISSION_ORIGIN_ID);

const featureKeyForRoleAndMissionIndex = (role, index) => `${role}.${index}`;

function* landingPositionPoints(
  landingPositions,
  selectedMissionIdInMissionEditorPanel
) {
  if (!landingPositions) {
    return;
  }

  for (const [missionIndex, landingPosition] of landingPositions.entries()) {
    if (!landingPosition) {
      continue;
    }

    if (
      selectedMissionIdInMissionEditorPanel !== undefined &&
      selectedMissionIdInMissionEditorPanel !== missionIndex
    ) {
      continue;
    }

    const center = mapViewCoordinateFromLonLat([
      landingPosition.lon,
      landingPosition.lat,
    ]);

    yield (
      <Feature
        key={featureKeyForRoleAndMissionIndex('land', missionIndex)}
        id={landingPositionIdToGlobalId(missionIndex)}
        style={landingPositionStyle}
      >
        <geom.Point coordinates={center} />
      </Feature>
    );
  }
}

function* homePositionPoints(
  homePositions,
  selectedMissionIdInMissionEditorPanel
) {
  if (!homePositions) {
    return;
  }

  for (const [missionIndex, homePosition] of homePositions.entries()) {
    if (!homePosition) {
      continue;
    }

    if (
      selectedMissionIdInMissionEditorPanel !== undefined &&
      selectedMissionIdInMissionEditorPanel !== missionIndex
    ) {
      continue;
    }

    const center = mapViewCoordinateFromLonLat([
      homePosition.lon,
      homePosition.lat,
    ]);

    yield (
      <Feature
        key={featureKeyForRoleAndMissionIndex('home', missionIndex)}
        id={homePositionIdToGlobalId(missionIndex)}
        style={takeoffPositionStyle}
      >
        <geom.Point coordinates={center} />
      </Feature>
    );
  }
}

function* mapOriginMarker(
  coordinateSystemType,
  mapOrigin,
  orientation,
  selection
) {
  if (!mapOrigin) {
    return;
  }

  const tail = mapViewCoordinateFromLonLat(mapOrigin);
  const armLength = 50 /* meters */ / getPointResolution('EPSG:3857', 1, tail);
  const headY = [0, coordinateSystemType === 'nwu' ? armLength : -armLength];
  const headX = [armLength, 0];
  const selected =
    selection.includes(MAP_ORIGIN_GLOBAL_ID + '$x') ||
    selection.includes(MAP_ORIGIN_GLOBAL_ID + '$y');
  Coordinate.rotate(headX, toRadians(90 - orientation));
  Coordinate.rotate(headY, toRadians(90 - orientation));
  Coordinate.add(headY, tail);
  Coordinate.add(headX, tail);

  yield* [
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
}

function* missionAreaBoundaries(
  missionItemsWithAreas,
  selection,
  selectedTool
) {
  if (!missionItemsWithAreas) {
    return;
  }

  for (const { id, area } of missionItemsWithAreas) {
    const areaBoundaryInMapCoordinates = area?.points?.map(
      unary(mapViewCoordinateFromLonLat)
    );
    closePolygon(areaBoundaryInMapCoordinates);

    const globalIdOfMissionItem = missionItemIdToGlobalId(id);
    const selected = selection.includes(globalIdOfMissionItem);

    yield (
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
  }
}

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
    ratios: getCompletionRatiosForMissionItemById(state, ownProps.id),
  })
)(WaypointMarkerPresentation);

function* missionWaypointMarkers(
  missionItemsWithCoordinates,
  selection,
  selectedMissionIdInMissionEditorPanel
) {
  if (!missionItemsWithCoordinates) {
    return;
  }

  for (const { coordinate, id, index, item } of missionItemsWithCoordinates) {
    if (
      selectedMissionIdInMissionEditorPanel !== undefined &&
      !doesMissionIndexParticipateInMissionItem(
        selectedMissionIdInMissionEditorPanel
      )(item)
    ) {
      continue;
    }

    const globalIdOfMissionItem = missionItemIdToGlobalId(id);
    const selected = selection.includes(globalIdOfMissionItem);
    const center = mapViewCoordinateFromLonLat([
      coordinate.lon,
      coordinate.lat,
    ]);

    yield (
      <WaypointMarker
        key={globalIdOfMissionItem}
        center={center}
        globalId={globalIdOfMissionItem}
        id={id}
        index={index}
        selected={selected}
      />
    );
  }
}

function* missionTrajectoryLine(
  currentItemIndices,
  currentItemRatios,
  allMissionItemsWithCoordinates,
  missionMapping,
  selectedMissionIdInMissionEditorPanel
) {
  if (!allMissionItemsWithCoordinates) {
    return;
  }

  for (const missionIndex of missionMapping.keys()) {
    if (
      selectedMissionIdInMissionEditorPanel !== undefined &&
      selectedMissionIdInMissionEditorPanel !== missionIndex
    ) {
      continue;
    }

    const missionItemsWithCoordinates = allMissionItemsWithCoordinates.filter(
      ({ item }) => doesMissionIndexParticipateInMissionItem(missionIndex)(item)
    );
    const currentItemIndex = currentItemIndices[missionIndex];
    const currentItemRatio = currentItemRatios[missionIndex];

    if (missionItemsWithCoordinates.length === 0) {
      continue;
    }

    // This should be done like below but lodash doesn't have `span`
    // `const [done, todo] = span(missionItemsWithCoordinates, isDone)`,
    const isDone = (mi) => mi.index < currentItemIndex;
    const doneMissionItems = takeWhile(missionItemsWithCoordinates, isDone);
    const todoMissionItems = dropWhile(missionItemsWithCoordinates, isDone);

    const doneMissionItemsInMapCoordinates = doneMissionItems.map(
      ({ coordinate }) =>
        mapViewCoordinateFromLonLat([coordinate.lon, coordinate.lat])
    );
    const todoMissionItemsInMapCoordinates = todoMissionItems.map(
      ({ coordinate }) =>
        mapViewCoordinateFromLonLat([coordinate.lon, coordinate.lat])
    );

    // There are already some completed items, but there are still more
    // left to be done, so a split point needs to be inserted.
    if (doneMissionItems.length > 0 && todoMissionItems.length > 0) {
      const ratio =
        (todoMissionItems[0].index === currentItemIndex
          ? // If the ratio information belongs to the next mission item
            // with coordinates
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

    yield* [
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
  }
}

function* auxiliaryMissionLines(
  homePositions,
  allMissionItemsWithCoordinates,
  missionMapping,
  returnToHomeItems,
  selectedMissionIdInMissionEditorPanel
) {
  if (!homePositions || !allMissionItemsWithCoordinates) {
    return;
  }

  for (const missionIndex of missionMapping.keys()) {
    if (
      selectedMissionIdInMissionEditorPanel !== undefined &&
      selectedMissionIdInMissionEditorPanel !== missionIndex
    ) {
      continue;
    }

    const missionItemsWithCoordinates = allMissionItemsWithCoordinates.filter(
      ({ item }) => doesMissionIndexParticipateInMissionItem(missionIndex)(item)
    );

    if (
      !homePositions[missionIndex] ||
      missionItemsWithCoordinates.length === 0
    ) {
      continue;
    }

    const findSurroundingWaypoints = (index) => ({
      before: missionItemsWithCoordinates.findLast((mi) => mi.index < index),
      after: missionItemsWithCoordinates.find((mi) => mi.index > index),
    });

    const makeFeature = (key, id, from, to) => (
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
                featureKeyForRoleAndMissionIndex(`${id}.before`, missionIndex),
                plannedTrajectoryIdToGlobalId(`${id}$before$${missionIndex}`),
                before.coordinate,
                homePositions[missionIndex]
              ),
            ]
          : []),
        ...(after
          ? [
              makeFeature(
                featureKeyForRoleAndMissionIndex(`${id}.after`, missionIndex),
                plannedTrajectoryIdToGlobalId(`${id}$after$${missionIndex}`),
                homePositions[missionIndex],
                after.coordinate
              ),
            ]
          : []),
      ];
    };

    yield* [
      // Extend the array with an extra item at the beginning in order to also
      // show a line connecting the home point to the first waypoint, as there
      // is no "Return to home" mission item at the beginning of missions.
      { id: 'start', index: -1 },
      ...returnToHomeItems.map(({ index, item: { id } }) => ({
        id,
        index,
      })),
    ].flatMap(makeFeatures);
  }
}

function* missionOriginMarker(missionOrientation, missionOrigin) {
  if (!missionOrigin) {
    return;
  }

  yield (
    <Feature
      key='missionOrigin'
      id={MISSION_ORIGIN_GLOBAL_ID}
      properties={{ skipSelection: true }}
      style={createMissionOriginStyle(missionOrientation)}
    >
      <geom.Point coordinates={mapViewCoordinateFromLonLat(missionOrigin)} />
    </Feature>
  );
}

function* convexHullPolygon(convexHull, selection) {
  if (!convexHull) {
    return;
  }

  const convexHullInMapCoordinates = convexHull.map((coord) =>
    mapViewCoordinateFromLonLat([coord.lon, coord.lat])
  );
  closePolygon(convexHullInMapCoordinates);

  const selected = selection.includes(CONVEX_HULL_GLOBAL_ID);

  yield (
    <Feature
      key='missionConvexHull'
      id={CONVEX_HULL_GLOBAL_ID}
      style={[
        ...(selected ? [missionConvexHullSelectionStyle] : []),
        missionConvexHullBaseStyle,
      ]}
    >
      <geom.Polygon coordinates={convexHullInMapCoordinates} />
    </Feature>
  );
}

function* selectionTrajectoryFeatures(
  missionIndicesForTrajectories,
  uavIdsForTrajectories
) {
  if (Array.isArray(uavIdsForTrajectories)) {
    for (const uavId of uavIdsForTrajectories) {
      yield <UAVTrajectoryFeature key={`trajectory.${uavId}`} uavId={uavId} />;
    }
  }

  if (Array.isArray(missionIndicesForTrajectories)) {
    for (const missionIndex of missionIndicesForTrajectories) {
      yield (
        <MissionSlotTrajectoryFeature
          key={`trajectory.s${missionIndex}`}
          missionIndex={missionIndex}
        />
      );
    }
  }
}

const MissionInfoVectorSource = ({
  convexHull,
  coordinateSystemType,
  currentItemIndices,
  currentItemRatios,
  homePositions,
  landingPositions,
  mapOrigin,
  missionItemsWithAreas,
  missionItemsWithCoordinates,
  missionMapping,
  missionOrientation,
  missionOrigin,
  missionIndicesForTrajectories,
  orientation,
  returnToHomeItems,
  selectedMissionIdInMissionEditorPanel,
  selectedTool,
  selection,
  uavIdsForTrajectories,
}) => (
  <source.Vector>
    {
      // NOTE: Spreading here is currently unnecessary, as `React.Children.map`
      //       in `source.Vector` handles iterables anyway, but I couldn't find
      //       any official documentation about that behavior, so I decided to
      //       pass the generated features instead of the generator objects.
      [
        ...landingPositionPoints(
          landingPositions,
          selectedMissionIdInMissionEditorPanel
        ),
        ...homePositionPoints(
          homePositions,
          selectedMissionIdInMissionEditorPanel
        ),
        ...mapOriginMarker(
          coordinateSystemType,
          mapOrigin,
          orientation,
          selection
        ),
        ...missionAreaBoundaries(
          missionItemsWithAreas,
          selection,
          selectedTool
        ),
        ...missionWaypointMarkers(
          missionItemsWithCoordinates,
          selection,
          selectedMissionIdInMissionEditorPanel
        ),
        ...missionTrajectoryLine(
          currentItemIndices,
          currentItemRatios,
          missionItemsWithCoordinates,
          missionMapping,
          selectedMissionIdInMissionEditorPanel
        ),
        ...auxiliaryMissionLines(
          homePositions,
          missionItemsWithCoordinates,
          missionMapping,
          returnToHomeItems,
          selectedMissionIdInMissionEditorPanel
        ),
        ...missionOriginMarker(missionOrientation, missionOrigin),
        ...convexHullPolygon(convexHull, selection),
        ...selectionTrajectoryFeatures(
          missionIndicesForTrajectories,
          uavIdsForTrajectories
        ),
      ]
    }
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
  selectedMissionIdInMissionEditorPanel: PropTypes.string,
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
    currentItemIndices: getCurrentMissionItemIndexForEveryMissionIndex(state),
    currentItemRatios: getCurrentMissionItemRatioForEveryMissionIndex(state),
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
    missionMapping: getMissionMapping(state),
    missionOrientation: getOutdoorShowOrientation(state),
    missionOrigin: layer?.parameters?.showMissionOrigin
      ? getOutdoorShowOrigin(state)
      : undefined,
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
    selectedMissionIdInMissionEditorPanel:
      getSelectedMissionIdInMissionEditorPanel(state),
    selection: getSelection(state),
    uavIdsForTrajectories: layer?.parameters?.showTrajectoriesOfSelection
      ? getSelectedUAVIdsForTrajectoryDisplay(state)
      : undefined,
  }),
  // mapDispatchToProps
  {}
)(MissionInfoLayerPresentation);

import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import dropWhile from 'lodash-es/dropWhile';
import takeWhile from 'lodash-es/takeWhile';
import memoize from 'memoizee';
import { type Feature as OLFeature } from 'ol';
import * as Coordinate from 'ol/coordinate';
import type { LineString, SimpleGeometry } from 'ol/geom';
import Point from 'ol/geom/Point';
import { getPointResolution } from 'ol/proj';
import { Circle, Icon, Style, Text } from 'ol/style';
import PropTypes from 'prop-types';
import type { ChangeEvent, JSX } from 'react';
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
  GENERIC_MARKER_LABEL_CHARACTER_WIDTH,
  homePositionPoints,
  landingPositionPoints,
  orientationMarker,
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
  getSelectedMissionIdInMissionEditorPanel,
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
import type { GPSPosition } from '~/model/geography';
import {
  MAP_ORIGIN_ID,
  MISSION_ORIGIN_ID,
  missionItemIdToGlobalId,
  originIdToGlobalId,
  plannedTrajectoryIdToGlobalId,
} from '~/model/identifiers';
import type { Layer } from '~/model/layers';
import {
  type MissionIndex,
  type MissionItem,
  MissionItemType,
} from '~/model/missions';
import { getMapOriginRotationAngle } from '~/selectors/map';
import type { RootState } from '~/store/reducers';
import { hasFeature } from '~/utils/configuration';
import { formatMissionId } from '~/utils/formatting';
import {
  CoordinateSystemType,
  type EasNor,
  type LonLat,
  mapViewCoordinateFromLonLat,
} from '~/utils/geography';
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

type MissionInfoLayerParameters = {
  showConvexHull: boolean;
  showOrigin: boolean;
  showHomePositions: boolean;
  showLandingPositions: boolean;
  showMissionItems: boolean;
  showMissionOrigin: boolean;
  showTrajectoriesOfSelection: boolean;
};

type MissionInfoLayerSettingsPresentationProps = {
  layer: Layer<MissionInfoLayerParameters>;
  setLayerParameters: (parameters: Partial<MissionInfoLayerParameters>) => void;
};

const MissionInfoLayerSettingsPresentation = ({
  layer,
  setLayerParameters,
}: MissionInfoLayerSettingsPresentationProps) => {
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

  const handleChange =
    (name: keyof MissionInfoLayerParameters) =>
    (event: ChangeEvent<HTMLInputElement>) =>
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

type MissionInfoLayerSettingsOwnProps = {
  layerId: string;
};

export const MissionInfoLayerSettings = connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  (dispatch, ownProps: MissionInfoLayerSettingsOwnProps) => ({
    setLayerParameters(parameters: Record<string, unknown>) {
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
const originStyles = (selected: boolean, axis: 'x' | 'y') => [
  // Circle and label
  new Style({
    geometry: (feature) => {
      // Cast is valid because we know that the origin is represented by a point on the
      // map, and Point is a subclass of SimpleGeometry.
      const geom = feature.getGeometry() as SimpleGeometry;
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
 * Style for the marker representing the individual items in a waypoint mission.
 */
const createMissionItemBaseStyle = memoize(
  (current: boolean, done: boolean, selected: boolean) =>
    (feature: OLFeature) => {
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
const missionFlightAreaEditStyle = (selected: boolean) =>
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
const auxiliaryMissionItemLineStringStyle = (
  feature: OLFeature<LineString>
) => [
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

const featureKeyForRoleAndMissionIndex = (role: string, index: number) =>
  `${role}.${index}`;

const mapOriginMarker = (
  coordinateSystemType: CoordinateSystemType,
  mapOrigin: LonLat | undefined,
  orientation: number,
  selection: string[]
) => {
  if (mapOrigin) {
    const tail = mapViewCoordinateFromLonLat(mapOrigin);
    const armLength =
      50 /* meters */ / getPointResolution('EPSG:3857', 1, tail);
    const headY = [
      0,
      coordinateSystemType === CoordinateSystemType.NWU
        ? armLength
        : -armLength,
    ];
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

type MissionItemWithArea = {
  id: string;
  area: { points: LonLat[] };
};

type MissionItemWithCoordinates = {
  id: string;
  index: MissionIndex;
  coordinate: GPSPosition;
  item: MissionItem;
};

type ReturnToHomeMissionItem = {
  index: MissionIndex;
  item: MissionItem;
};

const missionAreaBoundaries = (
  missionItemsWithAreas: MissionItemWithArea[] | undefined,
  selection: string[],
  selectedTool: Tool
) =>
  missionItemsWithAreas?.map(({ id, area }) => {
    const areaBoundaryInMapCoordinates = area?.points?.map((point) =>
      mapViewCoordinateFromLonLat(point)
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

type WaypointMarkerPresentationProps = {
  center: number[];
  globalId: string;
  index: number;
  itemId: string;
  ratios: {
    avg: number | undefined;
    max: number | undefined;
    min: number | undefined;
  };
  selected: boolean;
};

const WaypointMarkerPresentation = ({
  center,
  globalId,
  index,
  ratios,
  selected,
  ...rest
}: WaypointMarkerPresentationProps) => (
  <Feature
    id={globalId}
    properties={{ index }}
    style={createMissionItemBaseStyle(
      ratios.max !== undefined &&
        ratios.max > 0 &&
        ratios.min !== undefined &&
        ratios.min < 1,
      ratios.min === 1,
      selected
    )}
    {...rest}
  >
    <geom.Point coordinates={center} />
  </Feature>
);

const WaypointMarker = connect(
  // mapStateToProps
  (state: RootState, ownProps: { itemId: string }) => ({
    ratios: getCompletionRatiosForMissionItemById(state, ownProps.itemId),
  })
)(WaypointMarkerPresentation);

const missionWaypointMarkers = (
  missionItemsWithCoordinates: MissionItemWithCoordinates[] | undefined,
  selection: string[],
  selectedMissionIdInMissionEditorPanel: MissionIndex | undefined
) =>
  missionItemsWithCoordinates
    ? missionItemsWithCoordinates.map(({ coordinate, id, index, item }) => {
        if (
          selectedMissionIdInMissionEditorPanel !== undefined &&
          !doesMissionIndexParticipateInMissionItem(
            selectedMissionIdInMissionEditorPanel
          )(item)
        ) {
          return null;
        }

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
  currentItemIndices: Array<number | undefined>,
  currentItemRatios: Array<number | undefined>,
  allMissionItemsWithCoordinates: MissionItemWithCoordinates[] | undefined,
  missionMapping: Array<string | null>,
  selectedMissionIdInMissionEditorPanel: MissionIndex | undefined
) => {
  if (allMissionItemsWithCoordinates) {
    return missionMapping.flatMap((_, missionIndex) => {
      if (
        selectedMissionIdInMissionEditorPanel !== undefined &&
        selectedMissionIdInMissionEditorPanel !== missionIndex
      ) {
        return [];
      }

      const missionItemsWithCoordinates = allMissionItemsWithCoordinates.filter(
        ({ item }) =>
          doesMissionIndexParticipateInMissionItem(missionIndex)(item)
      );
      const currentItemIndex = currentItemIndices[missionIndex];
      const currentItemRatio = currentItemRatios[missionIndex];
      if (currentItemIndex === undefined) {
        return [];
      }

      // This should be done like below but lodash doesn't have `span`
      // `const [done, todo] = span(missionItemsWithCoordinates, isDone)`,
      const isDone = (mi: MissionItemWithCoordinates) =>
        mi.index < currentItemIndex;
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

          // Non-null assertions because the arrays are confirmed to be non-empty.
          const lastDone = doneMissionItemsInMapCoordinates.at(-1)!;
          const firstTodo = todoMissionItemsInMapCoordinates.at(0)!;

          // Casting valid because lastDone and firstTodo are both EasNor
          const splitPoint = [
            lastDone[0] * (1 - ratio) + firstTodo[0] * ratio,
            lastDone[1] * (1 - ratio) + firstTodo[1] * ratio,
          ] as EasNor;

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
  homePositions: Array<GPSPosition | null> | undefined,
  allMissionItemsWithCoordinates: MissionItemWithCoordinates[] | undefined,
  missionMapping: Array<string | null>,
  returnToHomeItems: ReturnToHomeMissionItem[],
  selectedMissionIdInMissionEditorPanel: MissionIndex | undefined
) => {
  if (allMissionItemsWithCoordinates) {
    return missionMapping.flatMap((_, missionIndex) => {
      if (
        selectedMissionIdInMissionEditorPanel !== undefined &&
        selectedMissionIdInMissionEditorPanel !== missionIndex
      ) {
        return [];
      }

      const missionItemsWithCoordinates = allMissionItemsWithCoordinates.filter(
        ({ item }) =>
          doesMissionIndexParticipateInMissionItem(missionIndex)(item)
      );
      const homePosition = homePositions?.[missionIndex];
      if (homePosition && missionItemsWithCoordinates?.length > 0) {
        const findSurroundingWaypoints = (current: number) => ({
          before: missionItemsWithCoordinates.findLast(
            (mi) => mi.index < current
          ),
          after: missionItemsWithCoordinates.find((mi) => mi.index > current),
        });

        const makeFeature = (
          id: string,
          key: string,
          from: GPSPosition,
          to: GPSPosition
        ) => (
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

        const makeFeatures = ({ id, index }: { id: string; index: number }) => {
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
                    homePosition
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
                    homePosition,
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

const missionOriginMarker = (
  missionOrientation: number,
  missionOrigin: LonLat | undefined
) =>
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
  missionIndicesForTrajectories: MissionIndex[] | undefined,
  uavIdsForTrajectories: string[] | undefined
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

type MissionInfoVectorSourceProps = {
  convexHull?: GPSPosition[];
  coordinateSystemType: CoordinateSystemType;
  currentItemIndices: Array<number | undefined>;
  currentItemRatios: Array<number | undefined>;
  homePositions?: Array<GPSPosition | null>;
  landingPositions?: Array<GPSPosition | null>;
  mapOrigin?: LonLat;
  minimumDistanceBetweenHomePositions: number;
  minimumDistanceBetweenLandingPositions: number;
  missionItemsWithAreas?: MissionItemWithArea[];
  missionItemsWithCoordinates?: MissionItemWithCoordinates[];
  missionMapping: Array<string | null>;
  missionOrientation: number;
  missionOrigin?: LonLat;
  missionIndicesForTrajectories?: MissionIndex[];
  orientation?: number;
  returnToHomeItems: ReturnToHomeMissionItem[];
  selectedMissionIdInMissionEditorPanel?: MissionIndex;
  selectedTool: Tool;
  selection: string[];
  uavIdsForTrajectories?: string[];
};

// HACK: Add support for filtering the takeoff or landing markers being displayed
//       instead of hiding them by replacing the values with `null`...
function maskByIndex<T>(
  items?: T[],
  chosen?: number
): Array<T | null> | undefined {
  if (items === undefined) {
    return items;
  } else {
    return chosen !== undefined
      ? items.map((item, index) => (index === chosen ? item : null))
      : items;
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
  selectedMissionIdInMissionEditorPanel,
  selectedTool,
  selection,
  uavIdsForTrajectories,
}: MissionInfoVectorSourceProps) => (
  <source.Vector>
    {([] as Array<JSX.Element | null>).concat(
      homePositionPoints(
        maskByIndex(homePositions, selectedMissionIdInMissionEditorPanel),
        {
          minimumDistanceBetweenPositions: minimumDistanceBetweenHomePositions,
          estimatedLabelWidth: homePositions
            ? formatMissionId(homePositions.length - 1).length *
              GENERIC_MARKER_LABEL_CHARACTER_WIDTH
            : 0,
          selection,
        }
      ),
      landingPositionPoints(
        maskByIndex(landingPositions, selectedMissionIdInMissionEditorPanel),
        {
          minimumDistanceBetweenPositions:
            minimumDistanceBetweenLandingPositions,
          estimatedLabelWidth: landingPositions
            ? formatMissionId(landingPositions.length - 1).length *
              GENERIC_MARKER_LABEL_CHARACTER_WIDTH
            : 0,
        }
      ),
      mapOriginMarker(coordinateSystemType, mapOrigin, orientation, selection),
      missionAreaBoundaries(missionItemsWithAreas, selection, selectedTool),
      missionWaypointMarkers(
        missionItemsWithCoordinates,
        selection,
        selectedMissionIdInMissionEditorPanel
      ),
      missionTrajectoryLine(
        currentItemIndices,
        currentItemRatios,
        missionItemsWithCoordinates,
        missionMapping,
        selectedMissionIdInMissionEditorPanel
      ),
      auxiliaryMissionLines(
        homePositions,
        missionItemsWithCoordinates,
        missionMapping,
        returnToHomeItems,
        selectedMissionIdInMissionEditorPanel
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

type MissionInfoLayerOwnProps = {
  layer: Layer<MissionInfoLayerParameters>;
  zIndex: number;
};

type MissionInfoLayerPresentationProps = MissionInfoLayerOwnProps &
  MissionInfoVectorSourceProps;

const MissionInfoLayerPresentation = ({
  layer,
  zIndex,
  ...rest
}: MissionInfoLayerPresentationProps) => (
  <olLayer.Vector
    ref={markAsSelectableAndEditable}
    updateWhileAnimating
    updateWhileInteracting
    zIndex={zIndex}
  >
    <MissionInfoVectorSource {...rest} />
  </olLayer.Vector>
);

export const MissionInfoLayer = connect(
  // mapStateToProps
  (state: RootState, { layer }: MissionInfoLayerOwnProps) => ({
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
    mapOrigin: layer?.parameters?.showOrigin
      ? state.map.origin.position
      : undefined,
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
    selectedMissionIdInMissionEditorPanel:
      getSelectedMissionIdInMissionEditorPanel(state),
    selection: getVirtualSelection(state),
    uavIdsForTrajectories: layer?.parameters?.showTrajectoriesOfSelection
      ? getSelectedUAVIdsForTrajectoryDisplay(state)
      : undefined,
  }),
  // mapDispatchToProps
  {}
)(MissionInfoLayerPresentation);

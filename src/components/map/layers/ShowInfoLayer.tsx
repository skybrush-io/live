import memoizeOne from 'memoize-one';
import memoize from 'memoizee';
import type React from 'react';

import { Point } from 'ol/geom';
import type OLLayer from 'ol/layer/Layer';
import { getPointResolution } from 'ol/proj';
import { Icon, RegularShape, Style, Text } from 'ol/style';
import { type StyleFunction } from 'ol/style/Style';

import { Feature, geom, layer as olLayer, source } from '@collmot/ol-react';
import { closePolygon, toRadians } from '@skybrush/math';

import Colors from '~/components/colors';
import { type GPSPosition } from '~/model/geography';
import {
  areaIdToGlobalId,
  globalIdToHomePositionId,
  globalIdToLandingPositionId,
  GROSS_CONVEX_HULL_AREA_ID,
  homePositionIdToGlobalId,
  landingPositionIdToGlobalId,
  NET_CONVEX_HULL_AREA_ID,
} from '~/model/identifiers';
import { setLayerEditable, setLayerSelectable } from '~/model/layers';
import type { Identifier } from '~/utils/collections';
import { formatMissionId } from '~/utils/formatting';
import { type LonLat, mapViewCoordinateFromLonLat } from '~/utils/geography';
import {
  blackVeryThinOutline,
  fill,
  thinOutline,
  whiteThickOutline,
  whiteVeryThinOutline,
} from '~/utils/styles';

import missionOriginMarkerIcon from '~/../assets/img/mission-origin-marker.svg';

// === Show origin ===

const orientationMarkerStyle = memoizeOne(
  (orientation: number, color?: string) =>
    new Style({
      image: new Icon({
        src: missionOriginMarkerIcon,
        rotateWithView: true,
        rotation: toRadians(orientation),
        color,
      }),
    })
);

const skipSelection = { skipSelection: true };

export const orientationMarker = (
  orientation: number,
  origin: LonLat,
  id: string,
  color?: string
) => (
  <Feature
    key={id}
    id={id}
    properties={skipSelection}
    style={orientationMarkerStyle(orientation, color)}
  >
    <geom.Point coordinates={mapViewCoordinateFromLonLat(origin)} />
  </Feature>
);

// === Convex hull ===

export enum ConvexHullVariant {
  GROSS = 'gross',
  NET = 'net',
}

const convexHullGlobalIdsByVariant: Record<ConvexHullVariant, Identifier> = {
  [ConvexHullVariant.GROSS]: areaIdToGlobalId(GROSS_CONVEX_HULL_AREA_ID),
  [ConvexHullVariant.NET]: areaIdToGlobalId(NET_CONVEX_HULL_AREA_ID),
};

const convexHullStyles = {
  byVariant: {
    [ConvexHullVariant.GROSS]: new Style({
      stroke: thinOutline(Colors.grossShowConvexHull),
    }),
    [ConvexHullVariant.NET]: new Style({
      stroke: thinOutline(Colors.netShowConvexHull),
    }),
  } satisfies Record<ConvexHullVariant, Style>,
  selection: new Style({
    stroke: whiteThickOutline,
  }),
};

export const convexHullPolygon = (
  convexHull: GPSPosition[] | undefined,
  selection: string[],
  variant: ConvexHullVariant
) => {
  const globalId = convexHullGlobalIdsByVariant[variant];

  if (!convexHull) {
    return [];
  }

  const convexHullInMapCoordinates = convexHull.map((coord) =>
    mapViewCoordinateFromLonLat([coord.lon, coord.lat])
  );
  closePolygon(convexHullInMapCoordinates);
  const selected = selection.includes(globalId);

  return [
    <Feature
      key={variant}
      id={globalId}
      style={[
        ...(selected ? [convexHullStyles.selection] : []),
        convexHullStyles.byVariant[variant],
      ]}
    >
      <geom.Polygon coordinates={convexHullInMapCoordinates} />
    </Feature>,
  ];
};

// === Markers for positions ===

type PositionMarkerStyles = {
  label: (id: Identifier) => Style;
  marker: Style;
  selection: Style;
};

const GENERIC_MARKER_LABEL_FONT_SIZE = 12;

const createMemoizedLabelStyleFunction = (
  labelFunc: (id: Identifier) => string
) =>
  memoize(
    (id: Identifier) =>
      new Style({
        text: new Text({
          font: `${GENERIC_MARKER_LABEL_FONT_SIZE}px sans-serif`,
          offsetY: GENERIC_MARKER_LABEL_FONT_SIZE,
          text: labelFunc(id),
          textAlign: 'center',
        }),
      })
  );

/**
 * Creates base / selected marker styles for a position marker with the given
 * fill color and rotation.
 */
const createPositionMarkerStyles = ({
  color,
  labelFunc,
  rotation = 0,
}: {
  color: string;
  labelFunc: (id: Identifier) => string;
  rotation?: number;
}): PositionMarkerStyles => ({
  label: createMemoizedLabelStyleFunction(labelFunc),
  marker: new Style({
    image: new RegularShape({
      fill: fill(color),
      points: 3,
      radius: 6,
      rotation,
      stroke: blackVeryThinOutline,
    }),
  }),
  selection: new Style({
    image: new RegularShape({
      fill: fill(color),
      points: 3,
      radius: 6,
      rotation,
      stroke: whiteVeryThinOutline,
    }),
  }),
});

type PositionPointsOptions = {
  featureKeyPrefix: string;
  globalIdFromIndex: (index: number) => string;
  styleFunction: StyleFunction;
};

const positionPoints = (
  positions: Array<GPSPosition | null | undefined> | undefined,
  { featureKeyPrefix, globalIdFromIndex, styleFunction }: PositionPointsOptions
) =>
  Array.isArray(positions)
    ? positions
        .map((position, index) => {
          if (!position) {
            return null;
          }

          const featureKey = `${featureKeyPrefix}.${index}`;
          const globalIdOfFeature = globalIdFromIndex(index);
          const center = mapViewCoordinateFromLonLat([
            position.lon,
            position.lat,
          ]);

          return (
            <Feature
              key={featureKey}
              id={globalIdOfFeature}
              style={styleFunction}
            >
              <geom.Point coordinates={center} />
            </Feature>
          );
        })
        .filter(Boolean)
    : [];

// === Resolution-dependent visibility of markers ===

// Estimate the character width based on the font size.
export const GENERIC_MARKER_LABEL_CHARACTER_WIDTH =
  GENERIC_MARKER_LABEL_FONT_SIZE * 0.6;

type StyleFunctionFactoryForPositionWithDynamicallyVisibleLabelContext = {
  estimatedLabelWidth?: number;
  minimumDistanceBetweenPositions?: number;
  selection?: Identifier[];
};
type StyleFunctionFactoryForPositionWithDynamicallyVisibleLabelOptions = {
  hideLabels?: boolean;
};

/**
 * Factory for creating style functions that dynamically show / hide the label
 * of a position marker based on spacing, estimated width and map resolution.
 */
const styleFunctionFactoryForPositionWithDynamicallyVisibleLabel =
  (
    styles: {
      label: (id: Identifier) => Style;
      marker: Style;
      selection: Style;
    },
    context?: StyleFunctionFactoryForPositionWithDynamicallyVisibleLabelContext,
    options?: StyleFunctionFactoryForPositionWithDynamicallyVisibleLabelOptions
  ): StyleFunction =>
  (feature, resolution) => {
    const geometry = feature.getGeometry();
    if (!(geometry instanceof Point)) {
      return;
    }

    // PERF: Move the resolution calculation out of the style function,
    //       such that it only gets computed once for all positions...
    const pointResolution = getPointResolution(
      'EPSG:3857',
      resolution,
      geometry.getCoordinates()
    );

    /**
     * The labels should only be visible if there is enough space between the
     * positions to fit them without overlap given the spacing and resolution.
     *
     * Units of the calculation:
     * - distance: m
     * - width: px
     * - resolution: m/px
     *
     * NOTE: In case of missing context data we assume the optimistic outcome.
     */
    const labelsWouldFitWithoutOverlap =
      context &&
      typeof context.minimumDistanceBetweenPositions === 'number' &&
      typeof context.estimatedLabelWidth === 'number'
        ? context.minimumDistanceBetweenPositions >
          context.estimatedLabelWidth * pointResolution
        : true;

    const featureId = String(feature.getId());
    const selected = context?.selection?.includes?.(featureId);
    const showLabel = labelsWouldFitWithoutOverlap && !options?.hideLabels;

    const stylesToApply = [styles.marker];
    if (selected) {
      stylesToApply.push(styles.selection);
    }
    if (showLabel) {
      stylesToApply.push(styles.label(featureId));
    }
    return stylesToApply;
  };

// === Landing ===

/**
 * Styles to use for landing markers.
 */
const landingMarkerStyles = createPositionMarkerStyles({
  color: Colors.markers.landing,
  labelFunc: (id) => formatMissionId(Number(globalIdToLandingPositionId(id))),
  rotation: Math.PI,
});

export const landingPositionPoints = (
  landingPositions: Array<GPSPosition | null | undefined> | undefined,
  context?: StyleFunctionFactoryForPositionWithDynamicallyVisibleLabelContext,
  options?: StyleFunctionFactoryForPositionWithDynamicallyVisibleLabelOptions
) =>
  positionPoints(landingPositions, {
    featureKeyPrefix: 'land',
    globalIdFromIndex: (index) => landingPositionIdToGlobalId(index.toString()),
    styleFunction: styleFunctionFactoryForPositionWithDynamicallyVisibleLabel(
      landingMarkerStyles,
      context,
      options
    ),
  });

// === Takeoff ===

/**
 * Styles to use for takeoff markers.
 */
const takeoffMarkerStyles = createPositionMarkerStyles({
  color: Colors.markers.takeoff,
  labelFunc: (id) => formatMissionId(Number(globalIdToHomePositionId(id))),
});

export const homePositionPoints = (
  homePositions: Array<GPSPosition | null | undefined> | undefined,
  context?: StyleFunctionFactoryForPositionWithDynamicallyVisibleLabelContext,
  options?: StyleFunctionFactoryForPositionWithDynamicallyVisibleLabelOptions
) =>
  positionPoints(homePositions, {
    featureKeyPrefix: 'home',
    globalIdFromIndex: (index) => homePositionIdToGlobalId(index.toString()),
    styleFunction: styleFunctionFactoryForPositionWithDynamicallyVisibleLabel(
      takeoffMarkerStyles,
      context,
      options
    ),
  });

// === Layer ===

type Props = React.PropsWithChildren<Readonly<{ zIndex?: number }>>;

const markLayerAsSelectableAndEditable = (layer: { layer: OLLayer }) => {
  if (layer) {
    setLayerEditable(layer.layer);
    setLayerSelectable(layer.layer);
  }
};

const ShowInfoLayer = (props: Props) => {
  const { children, zIndex } = props;
  return (
    <olLayer.Vector
      ref={markLayerAsSelectableAndEditable}
      updateWhileAnimating
      updateWhileInteracting
      zIndex={zIndex}
    >
      <source.Vector>{children}</source.Vector>
    </olLayer.Vector>
  );
};

export default ShowInfoLayer;

import mapValues from 'lodash-es/mapValues';
import memoize from 'memoizee';
import React from 'react';

import { getPointResolution } from 'ol/proj';
import { RegularShape, Style, Text } from 'ol/style';

// @ts-expect-error
import { Feature, geom, layer as olLayer, source } from '@collmot/ol-react';

import Colors from '~/components/colors';
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
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import { closePolygon, WorldCoordinate2D } from '~/utils/math';
import {
  blackVeryThinOutline,
  fill,
  thinOutline,
  whiteThickOutline,
  whiteVeryThinOutline,
} from '~/utils/styles';

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
  convexHull: WorldCoordinate2D[] | undefined,
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

// === Takeoff & Landing ===

// Estimate the character width based on the font size.
export const TAKEOFF_LANDING_POSITION_LABEL_FONT_SIZE = 12;
export const TAKEOFF_LANDING_POSITION_CHARACTER_WIDTH =
  TAKEOFF_LANDING_POSITION_LABEL_FONT_SIZE * 0.6;

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
  ) =>
  (feature: Feature, resolution: number) => {
    // PERF: Move the resolution calculation out of the style function,
    //       such that it only gets computed once for all positions...
    const pointResolution = getPointResolution(
      'EPSG:3857',
      resolution,
      feature.getGeometry().getCoordinates()
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
        ? context?.minimumDistanceBetweenPositions >
          context?.estimatedLabelWidth * pointResolution
        : true;

    return [
      styles.marker,
      ...(context?.selection?.includes?.(feature.getId())
        ? [styles.selection]
        : []),
      ...(labelsWouldFitWithoutOverlap && !options?.hideLabels
        ? [styles.label(feature.getId())]
        : []),
    ];
  };

// === Landing ===

/**
 * Shape to use for landing markers.
 */
const landingMarker = {
  base: new RegularShape({
    fill: fill(Colors.markers.landing),
    points: 3,
    radius: 6,
    rotation: Math.PI,
    stroke: blackVeryThinOutline,
  }),
  selected: new RegularShape({
    fill: fill(Colors.markers.landing),
    points: 3,
    radius: 6,
    rotation: Math.PI,
    stroke: whiteVeryThinOutline,
  }),
};

/**
 * Style to use for landing markers.
 */
const landingMarkerStyle = mapValues(
  landingMarker,
  (image) => new Style({ image })
);

/**
 * Memoized function to generate styles for landing position marker labels.
 */
const landingPositionLabelStyle = memoize(
  (id: Identifier) =>
    new Style({
      text: new Text({
        font: `${TAKEOFF_LANDING_POSITION_LABEL_FONT_SIZE}px sans-serif`,
        offsetY: -TAKEOFF_LANDING_POSITION_LABEL_FONT_SIZE,
        text: formatMissionId(Number(globalIdToLandingPositionId(id))),
        textAlign: 'center',
      }),
    })
);

export const landingPositionPoints = (
  landingPositions: (WorldCoordinate2D | undefined)[] | undefined,
  context?: StyleFunctionFactoryForPositionWithDynamicallyVisibleLabelContext,
  options?: StyleFunctionFactoryForPositionWithDynamicallyVisibleLabelOptions
) =>
  Array.isArray(landingPositions)
    ? landingPositions
        .map((landingPosition, index) => {
          if (!landingPosition) {
            return null;
          }

          const featureKey = `land.${index}`;
          const globalIdOfFeature = landingPositionIdToGlobalId(
            index.toString()
          );
          const center = mapViewCoordinateFromLonLat([
            landingPosition.lon,
            landingPosition.lat,
          ]);

          return (
            <Feature
              key={featureKey}
              id={globalIdOfFeature}
              style={styleFunctionFactoryForPositionWithDynamicallyVisibleLabel(
                {
                  label: landingPositionLabelStyle,
                  marker: landingMarkerStyle.base,
                  selection: landingMarkerStyle.selected,
                },
                context,
                options
              )}
            >
              <geom.Point coordinates={center} />
            </Feature>
          );
        })
        .filter(Boolean)
    : [];

// === Takeoff ===

/**
 * Shape to use for takeoff markers.
 */
const takeoffTriangle = {
  base: new RegularShape({
    fill: fill(Colors.markers.takeoff),
    points: 3,
    radius: 6,
    stroke: blackVeryThinOutline,
  }),
  selected: new RegularShape({
    fill: fill(Colors.markers.takeoff),
    points: 3,
    radius: 6,
    stroke: whiteVeryThinOutline,
  }),
};

/**
 * Style to use for takeoff markers.
 */
const takeoffTriangleStyle = mapValues(
  takeoffTriangle,
  (image) => new Style({ image })
);

/**
 * Memoized function to generate styles for takeoff position marker labels.
 */
const takeoffPositionLabelStyle = memoize(
  (id: Identifier) =>
    new Style({
      text: new Text({
        font: `${TAKEOFF_LANDING_POSITION_LABEL_FONT_SIZE}px sans-serif`,
        offsetY: TAKEOFF_LANDING_POSITION_LABEL_FONT_SIZE,
        text: formatMissionId(Number(globalIdToHomePositionId(id))),
        textAlign: 'center',
      }),
    })
);

export const homePositionPoints = (
  homePositions: (WorldCoordinate2D | undefined)[] | undefined,
  context?: StyleFunctionFactoryForPositionWithDynamicallyVisibleLabelContext,
  options?: StyleFunctionFactoryForPositionWithDynamicallyVisibleLabelOptions
) =>
  Array.isArray(homePositions)
    ? homePositions
        .map((homePosition, index) => {
          if (!homePosition) {
            return null;
          }

          const featureKey = `home.${index}`;
          const globalIdOfFeature = homePositionIdToGlobalId(index.toString());
          const center = mapViewCoordinateFromLonLat([
            homePosition.lon,
            homePosition.lat,
          ]);

          return (
            <Feature
              key={featureKey}
              id={globalIdOfFeature}
              style={styleFunctionFactoryForPositionWithDynamicallyVisibleLabel(
                {
                  label: takeoffPositionLabelStyle,
                  marker: takeoffTriangleStyle.base,
                  selection: takeoffTriangleStyle.selected,
                },
                context,
                options
              )}
            >
              <geom.Point coordinates={center} />
            </Feature>
          );
        })
        .filter(Boolean)
    : [];

// === Layer ===

type Props = {
  children: React.ReactNode;
  zIndex?: number;
};

function markLayerAsSelectableAndEditable(
  layer: typeof olLayer.Vector | null | undefined
) {
  if (layer) {
    setLayerEditable(layer.layer);
    setLayerSelectable(layer.layer);
  }
}

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

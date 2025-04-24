import React from 'react';

import { RegularShape, Style, Text } from 'ol/style';
import type { Options as StyleOptions } from 'ol/style/Style';

// @ts-ignore
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
 * Style for the marker representing the landing positions of the drones in
 * the current mission.
 */
const landingPositionStyle = (
  feature: Feature,
  resolution: number,
  selected?: boolean,
  hideLabel?: boolean
) => {
  const index = globalIdToLandingPositionId(feature.getId()) ?? '';
  const style: StyleOptions = {
    image: landingMarker[selected ? 'selected' : 'base'],
  };

  if (!hideLabel && resolution < 0.4) {
    style.text = new Text({
      font: '12px sans-serif',
      offsetY: -12,
      text: formatMissionId(Number.parseInt(index, 10)),
      textAlign: 'center',
    });
  }

  return new Style(style);
};

export const landingPositionPoints = (
  landingPositions: (WorldCoordinate2D | undefined)[] | undefined,
  selection?: Identifier[],
  hideLabel?: boolean
) =>
  Array.isArray(landingPositions)
    ? landingPositions
        .map((landingPosition, index) => {
          const featureKey = `land.${index}`;

          if (!landingPosition) {
            return null;
          }

          const globalIdOfFeature = landingPositionIdToGlobalId(
            index.toString()
          );
          const center = mapViewCoordinateFromLonLat([
            landingPosition.lon,
            landingPosition.lat,
          ]);
          const isSelected =
            selection !== undefined && selection.includes(globalIdOfFeature);

          return (
            <Feature
              key={featureKey}
              id={globalIdOfFeature}
              style={(feature: Feature, resolution: number) =>
                landingPositionStyle(feature, resolution, isSelected, hideLabel)
              }
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
 * Style for the marker representing the takeoff positions of the drones in
 * the current mission.
 */
const takeoffPositionStyle = (
  feature: Feature,
  resolution: number,
  selected?: boolean,
  hideLabel?: boolean
) => {
  const index = globalIdToHomePositionId(feature.getId()) ?? '';
  const style: StyleOptions = {
    image: takeoffTriangle[selected ? 'selected' : 'base'],
  };

  if (!hideLabel && resolution < 0.4) {
    style.text = new Text({
      font: '12px sans-serif',
      offsetY: 12,
      text: formatMissionId(Number.parseInt(index, 10)),
      textAlign: 'center',
    });
  }

  return new Style(style);
};

export const homePositionPoints = (
  homePositions: (WorldCoordinate2D | undefined)[] | undefined,
  selection?: Identifier[],
  hideLabel?: boolean
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
          const isSelected =
            selection !== undefined && selection.includes(globalIdOfFeature);

          return (
            <Feature
              key={featureKey}
              id={globalIdOfFeature}
              style={(feature: Feature, resolution: number) =>
                takeoffPositionStyle(feature, resolution, isSelected, hideLabel)
              }
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

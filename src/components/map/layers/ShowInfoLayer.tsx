import React from 'react';

import { RegularShape, Style, Text } from 'ol/style';
import type { Options as StyleOptions } from 'ol/style/Style';

// @ts-ignore
import { Feature, geom, layer as olLayer, source } from '@collmot/ol-react';

import Colors from '~/components/colors';
import {
  areaIdToGlobalId,
  CONVEX_HULL_AREA_ID,
  globalIdToHomePositionId,
  globalIdToLandingPositionId,
  homePositionIdToGlobalId,
  landingPositionIdToGlobalId,
} from '~/model/identifiers';
import { setLayerEditable, setLayerSelectable } from '~/model/layers';
import { formatMissionId } from '~/utils/formatting';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import { closePolygon, WorldCoordinate2D } from '~/utils/math';
import {
  blackVeryThinOutline,
  fill,
  thinOutline,
  whiteThickOutline,
} from '~/utils/styles';

const globalIds = {
  convexHull: areaIdToGlobalId(CONVEX_HULL_AREA_ID),
};

// === Convex hull ===

const convexHullStyles = {
  base: new Style({
    stroke: thinOutline(Colors.convexHull),
  }),
  selection: new Style({
    stroke: whiteThickOutline,
  }),
};

export const convexHullPolygon = (
  convexHull: WorldCoordinate2D[] | undefined,
  selection: string[]
) => {
  if (!convexHull) {
    return [];
  }

  const convexHullInMapCoordinates = convexHull.map((coord) =>
    mapViewCoordinateFromLonLat([coord.lon, coord.lat])
  );
  closePolygon(convexHullInMapCoordinates);
  const selected = selection.includes(globalIds.convexHull);

  return [
    <Feature
      key='missionConvexHull'
      id={globalIds.convexHull}
      style={[
        ...(selected ? [convexHullStyles.selection] : []),
        convexHullStyles.base,
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
const landingMarker = new RegularShape({
  fill: fill(Colors.markers.landing),
  points: 3,
  radius: 6,
  rotation: Math.PI,
  stroke: blackVeryThinOutline,
});

/**
 * Style for the marker representing the landing positions of the drones in
 * the current mission.
 */
const landingPositionStyle = (feature: Feature, resolution: number) => {
  const index = globalIdToLandingPositionId(feature.getId()) ?? '';
  const style: StyleOptions = {
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

export const landingPositionPoints = (
  landingPositions: (WorldCoordinate2D | undefined)[] | undefined
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
    : [];

// === Takeoff ===

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
 * Style for the marker representing the takeoff positions of the drones in
 * the current mission.
 */
const takeoffPositionStyle = (feature: Feature, resolution: number) => {
  const index = globalIdToHomePositionId(feature.getId()) ?? '';
  const style: StyleOptions = {
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

export const homePositionPoints = (
  homePositions: (WorldCoordinate2D | undefined)[] | undefined
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
              style={takeoffPositionStyle}
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

const MissionInfoLayer = (props: Props) => {
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

export default MissionInfoLayer;

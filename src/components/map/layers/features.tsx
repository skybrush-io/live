import createColor from 'color';
import unary from 'lodash-es/unary';
import FillPattern from 'ol-ext/style/FillPattern';
import type OLFeature from 'ol/Feature';
import {
  type Geometry,
  type LineString,
  MultiPoint,
  MultiPolygon,
  Polygon,
} from 'ol/geom';
import type { ModifyEvent } from 'ol/interaction/Modify';
import type { Layer } from 'ol/layer';
import { Circle, type Stroke, Style, Text } from 'ol/style';
import type { GeometryFunction } from 'ol/style/Style';
import type { Ref } from 'react';
import { connect } from 'react-redux';

import {
  geom,
  interaction,
  layer,
  Feature as OLReactFeature,
  source,
} from '@collmot/ol-react';
import {
  closePolygon,
  euclideanDistance2D,
  type Vector2PlusTuple,
} from '@skybrush/math';

import { escapeKeyDown } from '~/components/map/conditions';
import { markAsSelectableAndEditable } from '~/components/map/layers/utils';
import { Tool } from '~/components/map/tools';
import {
  getFeaturesInOrder,
  getSelectedFeatureIds,
} from '~/features/map-features/selectors';
import {
  shouldFillFeature,
  shouldShowPointsOfFeature,
  suggestedColorForFeature,
} from '~/features/map-features/selectors-style-suggestions';
import type { FeatureWithProperties } from '~/features/map-features/types';
import { getGeofencePolygonId } from '~/features/mission/selectors';
import { showError } from '~/features/snackbar/actions';
import { FeatureType, LabelStyle } from '~/model/features';
import { featureIdToGlobalId } from '~/model/identifiers';
import type { RootState } from '~/store/reducers';
import { mapViewCoordinateFromLonLat, measureFeature } from '~/utils/geography';
import {
  dashedThickOutline,
  dottedThinOutline,
  fill,
  thinOutline,
  whiteThickOutline,
  whiteThinOutline,
} from '~/utils/styles';

// === Helper functions ===

/**
 * Returns an OpenLayers geometry representation of the given _Redux_
 * feature, using ol-react tags.
 */
const geometryForFeature = (feature: FeatureWithProperties) => {
  const { points, type } = feature;
  const coordinates = points.map(
    unary(mapViewCoordinateFromLonLat)
  ) as Vector2PlusTuple[];

  switch (type) {
    case FeatureType.CIRCLE:
      if (coordinates.length >= 2) {
        const center = coordinates[0];
        const radius = euclideanDistance2D(coordinates[0], coordinates[1]);
        return <geom.Circle center={center} radius={radius} />;
      }

      return null;

    case FeatureType.POINTS:
      return coordinates.length > 1 ? (
        <geom.MultiPoint coordinates={coordinates} />
      ) : (
        <geom.Point coordinates={coordinates[0]} />
      );

    case FeatureType.LINE_STRING:
      return <geom.LineString coordinates={coordinates} />;

    case FeatureType.POLYGON: {
      // OpenLayers requires the last coordinate to be the same as the first
      // one when a polygon is drawn
      closePolygon(coordinates);

      const holes = (feature.holes ?? []).map((hole) =>
        hole.map(unary(mapViewCoordinateFromLonLat))
      );

      for (const hole of holes) {
        closePolygon(hole as Vector2PlusTuple[]);
      }

      return <geom.Polygon coordinates={coordinates} holes={holes} />;
    }

    default:
      return null;
  }
};

const whiteThickOutlineStyle = new Style({ stroke: whiteThickOutline });
const labelStrokes: Record<LabelStyle, Stroke | undefined> = {
  [LabelStyle.HIDDEN]: undefined,
  [LabelStyle.NORMAL]: undefined,
  [LabelStyle.THIN_OUTLINE]: whiteThinOutline,
  [LabelStyle.THICK_OUTLINE]: whiteThickOutline,
} as const;

const extractPointsFromLineString = (feature: OLFeature): Geometry =>
  new MultiPoint((feature.getGeometry() as LineString).getCoordinates());
const extractPointsFromPolygon = (feature: OLFeature): Geometry =>
  new MultiPoint((feature.getGeometry() as Polygon).getCoordinates().flat());

export const styleForPointsOfLineString = (
  selected: boolean,
  color: number[]
) =>
  new Style({
    image: new Circle({
      ...(selected && { stroke: whiteThinOutline }),
      fill: fill(color),
      radius: 5,
    }),
    geometry: extractPointsFromLineString as GeometryFunction,
  });
export const styleForPointsOfPolygon = (selected: boolean, color: number[]) =>
  new Style({
    image: new Circle({
      ...(selected && { stroke: whiteThinOutline }),
      fill: fill(color),
      radius: 5,
    }),
    geometry: extractPointsFromPolygon as GeometryFunction,
  });

type StyleForFeatureOptions = {
  isGeofence?: boolean;
  isSelected?: boolean;
  shouldShowPoints?: boolean;
  suggestedColor?: string;
  shouldFill?: boolean;
};

// TODO: cache the style somewhere?
const styleForFeature = (
  feature: FeatureWithProperties,
  {
    isGeofence,
    isSelected = false,
    shouldShowPoints,
    suggestedColor,
    shouldFill,
  }: StyleForFeatureOptions
) => {
  const { label, labelStyle, measure, showPoints, type } = feature;
  const parsedColor = createColor(suggestedColor);
  const styles = [];
  const radius = 6;

  switch (type) {
    case FeatureType.POINTS:
      styles.push(
        new Style({
          image: new Circle({
            ...(isSelected && { stroke: whiteThinOutline }),
            fill: fill(parsedColor.rgb().array()),
            radius,
          }),
        })
      );
      break;

    case FeatureType.LINE_STRING:
      if (isSelected) {
        styles.push(whiteThickOutlineStyle);
      }

      styles.push(
        new Style({
          stroke: (isGeofence ? dashedThickOutline : thinOutline)(
            parsedColor.rgb().array()
          ),
        })
      );

      if (shouldShowPoints) {
        // Show the vertices of the line string as well
        styles.push(
          styleForPointsOfLineString(isSelected, parsedColor.rgb().array())
        );
      }

      break;

    case FeatureType.POLYGON:
      // Dotted outline for holes
      styles.push(
        new Style({
          stroke: dottedThinOutline(parsedColor.rgb().array()),
          geometry(olFeature) {
            const [, ...holes] = (
              olFeature.getGeometry() as Polygon
            ).getCoordinates();
            return new MultiPolygon(holes.map((hole) => [hole]));
          },
          zIndex: 1,
        })
      );

      if (showPoints ?? shouldShowPoints) {
        styles.push(
          styleForPointsOfPolygon(isSelected, parsedColor.rgb().array())
        );
      }
    // Fallthrough

    default:
      if (shouldFill && !feature?.attributes?.isExclusionZone) {
        styles.push(
          new Style({
            fill: fill(
              parsedColor
                .fade(isSelected ? 0.5 : 0.75)
                .rgb()
                .array()
            ),
          })
        );
      }

      // Striped fill for exclusion zones
      if (feature?.attributes?.isExclusionZone) {
        styles.push(
          new Style({
            fill: new FillPattern({
              pattern: 'hatch',
              color: parsedColor
                .fade(isSelected ? 0.5 : 0.75)
                .rgb()
                .array(),
              size: 10,
              spacing: 20,
              angle: 45,
            }),
            // Exclusion zones are likely to overlap with other features, so
            // they are raised to the top in order to be more easily selectable
            zIndex: 1,
          })
        );
      }

      if (isSelected) {
        styles.push(whiteThickOutlineStyle);
      }

      styles.push(
        new Style({
          stroke: (isGeofence ? dashedThickOutline : thinOutline)(
            parsedColor.rgb().array()
          ),
          geometry(olFeature) {
            switch (type) {
              case FeatureType.POLYGON: {
                const boundary = (
                  olFeature.getGeometry() as Polygon
                ).getCoordinates()[0];
                return new Polygon([boundary]);
              }
              default: {
                return olFeature.getGeometry();
              }
            }
          },
        })
      );
  }

  if (label && label.length > 0 && labelStyle !== LabelStyle.HIDDEN) {
    styles.push(
      new Style({
        text: new Text({
          font: '12px sans-serif',
          offsetY: type === FeatureType.POINTS ? radius + 10 : 0,
          placement: type === FeatureType.LINE_STRING ? 'line' : 'point',
          stroke: labelStyle ? labelStrokes[labelStyle] : undefined,
          text: label,
          textAlign: 'center',
          textBaseline: type === FeatureType.LINE_STRING ? 'bottom' : 'middle',
        }),
      })
    );
  }

  if (measure) {
    styles.push(
      new Style({
        text: new Text({
          font: '12px sans-serif',
          offsetY: type === FeatureType.LINE_STRING ? 3 : 15,
          placement: type === FeatureType.LINE_STRING ? 'line' : 'point',
          stroke: labelStyle ? labelStrokes[labelStyle] : undefined,
          text: `(${measureFeature(feature)})`,
          textAlign: 'center',
          textBaseline: type === FeatureType.LINE_STRING ? 'top' : 'middle',
        }),
      })
    );
  }

  return styles;
};

type FeaturePresentationProps = {
  feature: FeatureWithProperties;
  isSelected?: boolean;
  isGeofence?: boolean;
  shouldFill?: boolean;
  shouldShowPoints?: boolean;
  suggestedColor?: string;
};

const FeaturePresentation = ({
  feature,
  isSelected,
  isGeofence,
  shouldFill,
  shouldShowPoints,
  suggestedColor,
  ...rest
}: FeaturePresentationProps) => (
  <OLReactFeature
    id={featureIdToGlobalId(feature.id)}
    style={styleForFeature(feature, {
      isGeofence,
      isSelected,
      shouldFill,
      shouldShowPoints,
      suggestedColor,
    })}
    {...rest}
  >
    {geometryForFeature(feature)}
  </OLReactFeature>
);

const Feature = connect(
  // mapStateToProps
  (
    state: RootState,
    { feature }: Pick<FeaturePresentationProps, 'feature'>
  ) => ({
    isGeofence: getGeofencePolygonId(state) === feature.id,
    isSelected: getSelectedFeatureIds(state).includes(feature.id),
    shouldFill: shouldFillFeature(state, feature.id),
    shouldShowPoints: shouldShowPointsOfFeature(state, feature.id),
    suggestedColor: suggestedColorForFeature(state, feature.id),
  })
)(FeaturePresentation);

// === The actual layer to be rendered ===

type FeaturesLayerPresentationProps = {
  features: FeatureWithProperties[];
  onFeatureModificationStarted?: (event: ModifyEvent) => void;
  onFeaturesModified?: (event: ModifyEvent) => void;
  selectedTool?: Tool;
  layerRefHandler?: Ref<{ layer: Layer }>;
  zIndex?: number;
};

const FeaturesLayerPresentation = ({
  features,
  onFeatureModificationStarted,
  onFeaturesModified,
  selectedTool,
  layerRefHandler = markAsSelectableAndEditable,
  zIndex,
}: FeaturesLayerPresentationProps) => (
  <layer.Vector
    ref={layerRefHandler}
    updateWhileAnimating
    updateWhileInteracting
    zIndex={zIndex}
  >
    <source.Vector>
      {features
        .filter((feature) => feature.visible)
        .map((feature) => (
          <Feature key={feature.id} feature={feature} />
        ))}
      {selectedTool === Tool.CUT_HOLE ? (
        <interaction.CutHole
          abortCondition={escapeKeyDown}
          onError={showError}
          onCutStart={onFeatureModificationStarted}
          onCutEnd={onFeaturesModified}
        />
      ) : null}
    </source.Vector>
  </layer.Vector>
);

// NOTE: The props `onFeaturesModified`, `selectedTool` and `zIndex` are
//       passed down through `stateObjectToLayer` from `MapViewLayers`
export const FeaturesLayer = connect(
  // mapStateToProps
  (state: RootState) => ({
    features: getFeaturesInOrder(state),
  })
)(FeaturesLayerPresentation);

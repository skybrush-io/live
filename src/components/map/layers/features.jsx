import createColor from 'color';
import unary from 'lodash-es/unary';
import FillPattern from 'ol-ext/style/FillPattern';
import { MultiPoint, MultiPolygon, Polygon } from 'ol/geom';
import { Circle, Style, Text } from 'ol/style';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import {
  Feature as OLFeature,
  geom,
  interaction,
  layer,
  source,
} from '@collmot/ol-react';

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
import { getGeofencePolygonId } from '~/features/mission/selectors';
import { showError } from '~/features/snackbar/actions';
import { FeatureType, LabelStyle } from '~/model/features';
import { featureIdToGlobalId } from '~/model/identifiers';
import { mapViewCoordinateFromLonLat, measureFeature } from '~/utils/geography';
import { closePolygon, euclideanDistance2D } from '~/utils/math';
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
const geometryForFeature = (feature) => {
  const { points, type } = feature;
  const coordinates = points.map(unary(mapViewCoordinateFromLonLat));

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
        closePolygon(hole);
      }

      return <geom.Polygon coordinates={coordinates} holes={holes} />;
    }

    default:
      return null;
  }
};

const whiteThickOutlineStyle = new Style({ stroke: whiteThickOutline });
const labelStrokes = {
  [LabelStyle.THIN_OUTLINE]: whiteThinOutline,
  [LabelStyle.THICK_OUTLINE]: whiteThickOutline,
};

const extractPointsFromLineString = (feature) =>
  new MultiPoint(feature.getGeometry().getCoordinates());
const extractPointsFromPolygon = (feature) =>
  new MultiPoint(feature.getGeometry().getCoordinates().flat());

export const styleForPointsOfLineString = (selected, color) =>
  new Style({
    image: new Circle({
      ...(selected && { stroke: whiteThinOutline }),
      fill: fill(color),
      radius: 5,
    }),
    geometry: extractPointsFromLineString,
  });
export const styleForPointsOfPolygon = (selected, color) =>
  new Style({
    image: new Circle({
      ...(selected && { stroke: whiteThinOutline }),
      fill: fill(color),
      radius: 5,
    }),
    geometry: extractPointsFromPolygon,
  });

// TODO: cache the style somewhere?
const styleForFeature = (
  feature,
  {
    isGeofence = false,
    isSelected = false,
    shouldShowPoints,
    suggestedColor,
    shouldFill,
  }
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
            const [, ...holes] = olFeature.getGeometry().getCoordinates();
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
                const boundary = olFeature.getGeometry().getCoordinates()[0];
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
          stroke: labelStrokes[labelStyle],
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
          placement: type === 'lineString' ? 'line' : 'point',
          stroke: labelStrokes[labelStyle],
          text: `(${measureFeature(feature)})`,
          textAlign: 'center',
          textBaseline: type === FeatureType.LINE_STRING ? 'top' : 'middle',
        }),
      })
    );
  }

  return styles;
};

const FeaturePresentation = ({
  feature,
  isSelected,
  isGeofence,
  shouldFill,
  shouldShowPoints,
  suggestedColor,
  ...rest
}) => (
  <OLFeature
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
  </OLFeature>
);

FeaturePresentation.propTypes = {
  feature: PropTypes.object.isRequired,
  isGeofence: PropTypes.bool,
  isSelected: PropTypes.bool,
  shouldFill: PropTypes.bool,
  shouldShowPoints: PropTypes.bool,
  suggestedColor: PropTypes.string,
};

const Feature = connect(
  // mapStateToProps
  (state, { feature }) => ({
    isGeofence: getGeofencePolygonId(state) === feature.id,
    isSelected: getSelectedFeatureIds(state).includes(feature.id),
    shouldFill: shouldFillFeature(state, feature.id),
    shouldShowPoints: shouldShowPointsOfFeature(state, feature.id),
    suggestedColor: suggestedColorForFeature(state, feature.id),
  })
)(FeaturePresentation);

// === The actual layer to be rendered ===

const FeaturesLayerPresentation = ({
  features,
  onError,
  onFeatureModificationStarted,
  onFeaturesModified,
  selectedTool,
  layerRefHandler = markAsSelectableAndEditable,
  zIndex,
}) => (
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
          onError={onError}
          onCutStart={onFeatureModificationStarted}
          onCutEnd={onFeaturesModified}
        />
      ) : null}
    </source.Vector>
  </layer.Vector>
);

FeaturesLayerPresentation.propTypes = {
  selectedTool: PropTypes.string,
  zIndex: PropTypes.number,
  layerRefHandler: PropTypes.func,

  features: PropTypes.arrayOf(PropTypes.object).isRequired,

  onError: PropTypes.func,
  onFeatureModificationStarted: PropTypes.func,
  onFeaturesModified: PropTypes.func,
};

// NOTE: The props `onFeaturesModified`, `selectedTool` and `zIndex` are
//       passed down through `stateObjectToLayer` from `MapViewLayers`
export const FeaturesLayer = connect(
  // mapStateToProps
  (state) => ({
    features: getFeaturesInOrder(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onError(message) {
      dispatch(showError(message));
    },
  })
)(FeaturesLayerPresentation);

import createColor from 'color';
import unary from 'lodash-es/unary';
import PropTypes from 'prop-types';
import { MultiPoint, MultiPolygon, Polygon } from 'ol/geom';
import { Circle, Style, Text } from 'ol/style';
import React, { useCallback, useRef } from 'react';
import { connect } from 'react-redux';

import {
  Feature as OLFeature,
  geom,
  interaction,
  layer,
  source,
} from '@collmot/ol-react';

import { snapEndToStart } from '../interactions/utils';
import { Tool } from '../tools';

import {
  getFeaturesInOrder,
  getSelectedFeatureIds,
  shouldShowPointsOfFeature,
} from '~/features/map-features/selectors';
import { getGeofencePolygonId } from '~/features/mission/selectors';
import { showError } from '~/features/snackbar/actions';
import { FeatureType, LabelStyle } from '~/model/features';
import { featureIdToGlobalId } from '~/model/identifiers';
import { handleFeatureUpdatesInOpenLayers } from '~/model/openlayers';
import { setLayerEditable, setLayerSelectable } from '~/model/layers';
import { mapViewCoordinateFromLonLat, measureFeature } from '~/utils/geography';
import { closePolygon, euclideanDistance2D } from '~/utils/math';
import {
  fill,
  primaryColor,
  thinOutline,
  whiteThickOutline,
  whiteThinOutline,
  dashedThickOutline,
  dottedThinOutline,
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

const styleForPointsOfLineString = (feature, selected, color) =>
  new Style({
    image: new Circle({
      stroke: selected ? whiteThinOutline : undefined,
      fill: fill(color.rgb().array()),
      radius: 5,
    }),
    geometry: extractPointsFromLineString,
  });
const styleForPointsOfPolygon = (feature, selected, color) =>
  new Style({
    image: new Circle({
      stroke: selected ? whiteThinOutline : undefined,
      fill: fill(color.rgb().array()),
      radius: 5,
    }),
    geometry: extractPointsFromPolygon,
  });

// TODO: cache the style somewhere?
const styleForFeature = (
  feature,
  isGeofence = false,
  isSelected = false,
  shouldShowPoints = false
) => {
  const { color, label, labelStyle, measure, type, filled } = feature;
  const parsedColor = createColor(color || primaryColor);
  const styles = [];
  const radius = 6;

  switch (type) {
    case FeatureType.POINTS:
      styles.push(
        new Style({
          image: new Circle({
            stroke: isSelected ? whiteThinOutline : undefined,
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
          styleForPointsOfLineString(feature, isSelected, parsedColor)
        );
      }

      break;

    case FeatureType.POLYGON:
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

      if (shouldShowPoints) {
        styles.push(styleForPointsOfPolygon(feature, isSelected, parsedColor));
      }
    // Fallthrough

    default:
      if (filled) {
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
  shouldShowPoints,
  ...rest
}) => (
  <OLFeature
    id={featureIdToGlobalId(feature.id)}
    style={styleForFeature(feature, isGeofence, isSelected, shouldShowPoints)}
    {...rest}
  >
    {geometryForFeature(feature)}
  </OLFeature>
);

FeaturePresentation.propTypes = {
  feature: PropTypes.object.isRequired,
  isGeofence: PropTypes.bool,
  isSelected: PropTypes.bool,
  shouldShowPoints: PropTypes.bool,
};

const Feature = connect(
  // mapStateToProps
  (state, { feature }) => ({
    isGeofence: getGeofencePolygonId(state) === feature.id,
    isSelected: getSelectedFeatureIds(state).includes(feature.id),
    shouldShowPoints: shouldShowPointsOfFeature(state, feature.id),
  })
)(FeaturePresentation);

// === The actual layer to be rendered ===

function markAsSelectableAndEditable(layer) {
  if (layer) {
    setLayerEditable(layer.layer);
    setLayerSelectable(layer.layer);
  }
}

function takeFeatureRevisionSnapshot(features) {
  const result = {};
  for (const feature of features) {
    result[feature.getId()] = feature.getRevision();
  }

  return result;
}

function getFeaturesThatChanged(features, snapshot) {
  const result = [];
  const addedIds = [];
  for (const feature of features) {
    const id = feature.getId();
    if (addedIds.includes(id)) {
      // For some reason, some features appear twice in the features array
      // in the onModifyEnd array in OpenLayers. Not sure if it is a bug in
      // OpenLayers or on our side, but we need to be careful nevertheless.
      continue;
    }

    if (snapshot[id] === undefined || snapshot[id] !== feature.getRevision()) {
      result.push(feature);
      addedIds.push(id);
    }
  }

  return result;
}

const FeaturesLayerPresentation = ({
  features,
  geofencePolygonId,
  onError,
  onFeatureModificationStarted,
  onFeaturesModified,
  selectedTool,
  zIndex,
}) => {
  // We actually do _not_ want the component to re-render when this variable
  // changes because we only need it to keep track of something between an
  // onModifyStart and an onModifyEnd event.
  const featureSnapshot = useRef(null);

  const onModifyStart = useCallback(
    (event) => {
      const featureArray = event.features.getArray();

      featureArray
        .find((f) => f.getId() === featureIdToGlobalId(geofencePolygonId))
        ?.getGeometry()
        .on('change', snapEndToStart);

      // Take a snapshot of all the features in the event so we can figure out
      // later which ones were modified
      featureSnapshot.current = takeFeatureRevisionSnapshot(featureArray);
      if (onFeatureModificationStarted) {
        onFeatureModificationStarted(event);
      }
    },
    [onFeatureModificationStarted, geofencePolygonId]
  );

  const onModifyEnd = useCallback(
    (event) => {
      const featureArray = event.features.getArray();

      featureArray
        .find((f) => f.getId() === featureIdToGlobalId(geofencePolygonId))
        ?.getGeometry()
        .un('change', snapEndToStart);

      if (onFeaturesModified) {
        onFeaturesModified(
          event,
          getFeaturesThatChanged(featureArray, featureSnapshot.current)
        );
      }

      featureSnapshot.current = null;
    },
    [onFeaturesModified, geofencePolygonId]
  );

  return (
    <layer.Vector
      ref={markAsSelectableAndEditable}
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
            onCutStart={onModifyStart}
            onCutEnd={onModifyEnd}
            onError={onError}
          />
        ) : null}
        {selectedTool === Tool.EDIT_FEATURE ? (
          <interaction.Modify
            onModifyStart={onModifyStart}
            onModifyEnd={onModifyEnd}
          />
        ) : null}
      </source.Vector>
    </layer.Vector>
  );
};

FeaturesLayerPresentation.propTypes = {
  selectedTool: PropTypes.string,
  zIndex: PropTypes.number,

  features: PropTypes.arrayOf(PropTypes.object).isRequired,
  geofencePolygonId: PropTypes.string,

  onError: PropTypes.func,
  onFeatureModificationStarted: PropTypes.func,
  onFeaturesModified: PropTypes.func,
};

export const FeaturesLayer = connect(
  // mapStateToProps
  (state) => ({
    features: getFeaturesInOrder(state),
    geofencePolygonId: getGeofencePolygonId(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onError(message) {
      dispatch(showError(message));
    },
    onFeaturesModified(event, features) {
      handleFeatureUpdatesInOpenLayers(features, dispatch, {
        type: 'modify',
        event,
      });
    },
  })
)(FeaturesLayerPresentation);

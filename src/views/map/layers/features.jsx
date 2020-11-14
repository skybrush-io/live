import createColor from 'color';
import isEmpty from 'lodash-es/isEmpty';
import unary from 'lodash-es/unary';
import PropTypes from 'prop-types';
import { Circle, Style, Text } from 'ol/style';
import React, { useCallback, useState } from 'react';
import { connect } from 'react-redux';

import { Feature, geom, interaction, layer, source } from '@collmot/ol-react';

import { Tool } from '../tools';

import { updateFeatureCoordinates } from '~/actions/features';
import {
  createFeatureFromOpenLayers,
  FeatureType,
  LabelStyle,
} from '~/model/features';
import { featureIdToGlobalId, globalIdToFeatureId } from '~/model/identifiers';
import { setLayerEditable, setLayerSelectable } from '~/model/layers';
import { getFeaturesInOrder } from '~/selectors/ordered';
import { getSelectedFeatureIds } from '~/selectors/selection';
import {
  mapViewCoordinateFromLonLat,
  euclideanDistance,
} from '~/utils/geography';
import {
  fill,
  primaryColor,
  thinOutline,
  whiteThickOutline,
  whiteThinOutline,
  dashedThickOutline,
} from '~/utils/styles';

import { getGeofencePolygonId } from '~/features/mission/selectors';

// === Settings for this particular layer type ===

const FeaturesLayerSettingsPresentation = () => null;

export const FeaturesLayerSettings = connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  null
)(FeaturesLayerSettingsPresentation);

// === Helper functions ===

const geometryForFeature = (feature) => {
  const { points, type } = feature;
  const coordinates = points.map(unary(mapViewCoordinateFromLonLat));

  switch (type) {
    case FeatureType.CIRCLE:
      if (coordinates.length >= 2) {
        const center = coordinates[0];
        const radius = euclideanDistance(coordinates[0], coordinates[1]);
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

    case FeatureType.POLYGON:
      // OpenLayers requires the last coordinate to be the same as the first
      // one when a polygon is drawn
      if (coordinates.length > 0) {
        coordinates.push(coordinates[0]);
      }

      return <geom.Polygon coordinates={coordinates} />;

    default:
      return null;
  }
};

const whiteThickOutlineStyle = new Style({ stroke: whiteThickOutline });
const labelStrokes = {
  [LabelStyle.THIN_OUTLINE]: whiteThinOutline,
  [LabelStyle.THICK_OUTLINE]: whiteThickOutline,
};

// TODO: cache the style somewhere?
const styleForFeature = (feature, selected = false, isGeofence = false) => {
  const { color, label, labelStyle, type, filled } = feature;
  const parsedColor = createColor(color || primaryColor);
  const styles = [];
  const radius = 6;

  switch (type) {
    case FeatureType.POINTS:
      styles.push(
        new Style({
          image: new Circle({
            stroke: selected ? whiteThinOutline : undefined,
            fill: fill(parsedColor.rgb().array()),
            radius,
          }),
        })
      );
      break;

    case FeatureType.LINE_STRING:
      if (selected) {
        styles.push(whiteThickOutlineStyle);
      }

      styles.push(
        new Style({
          stroke: (isGeofence ? dashedThickOutline : thinOutline)(
            parsedColor.rgb().array()
          ),
        })
      );
      break;

    case FeatureType.POLYGON:
    // Fallthrough

    default:
      if (filled) {
        styles.push(
          new Style({
            fill: fill(
              parsedColor
                .fade(selected ? 0.5 : 0.75)
                .rgb()
                .array()
            ),
          })
        );
      }

      if (selected) {
        styles.push(whiteThickOutlineStyle);
      }

      styles.push(
        new Style({
          stroke: (isGeofence ? dashedThickOutline : thinOutline)(
            parsedColor.rgb().array()
          ),
        })
      );
  }

  if (label && label.length > 0 && labelStyle !== LabelStyle.HIDDEN) {
    styles.push(
      new Style({
        text: new Text({
          font: '12px sans-serif',
          offsetY: type === 'points' ? radius + 10 : 0,
          placement: type === 'lineString' ? 'line' : 'point',
          stroke: labelStrokes[labelStyle],
          text: label,
          textAlign: 'center',
        }),
      })
    );
  }

  return styles;
};

const renderFeature = (feature, selected, isGeofence) => {
  const { id } = feature;
  return (
    <Feature
      key={id}
      id={featureIdToGlobalId(id)}
      style={styleForFeature(feature, selected, isGeofence)}
    >
      {geometryForFeature(feature)}
    </Feature>
  );
};

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
  onFeatureModificationStarted,
  onFeaturesModified,
  selectedFeatureIds,
  selectedTool,
  zIndex,
}) => {
  // We actually do _not_ want the component to re-render when this variable
  // changes because we only need it to keep track of something between an
  // onModifyStart and an onModifyEnd event.
  const featureSnapshot = useState({ snapshot: null })[0];

  const onModifyStart = useCallback(
    (event) => {
      // Take a snapshot of all the features in the event so we can figure out
      // later which ones were modified
      featureSnapshot.value = takeFeatureRevisionSnapshot(
        event.features.getArray()
      );
      if (onFeatureModificationStarted) {
        onFeatureModificationStarted(event);
      }
    },
    [onFeatureModificationStarted]
  );

  const onModifyEnd = useCallback(
    (event) => {
      if (onFeaturesModified) {
        onFeaturesModified(
          event,
          getFeaturesThatChanged(
            event.features.getArray(),
            featureSnapshot.value
          )
        );
      }

      featureSnapshot.value = null;
    },
    [onFeaturesModified]
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
          .map((feature) =>
            renderFeature(
              feature,
              selectedFeatureIds.includes(feature.id),
              feature.id === geofencePolygonId
            )
          )}
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
  selectedFeatureIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  geofencePolygonId: PropTypes.string,

  onFeatureModificationStarted: PropTypes.func,
  onFeaturesModified: PropTypes.func,
};

export const FeaturesLayer = connect(
  // mapStateToProps
  (state) => ({
    features: getFeaturesInOrder(state),
    selectedFeatureIds: getSelectedFeatureIds(state),
    geofencePolygonId: getGeofencePolygonId(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onFeaturesModified: (_event, changedFeatures) => {
      const updatedUserFeatures = {};
      for (const feature of changedFeatures) {
        const userFeatureId = globalIdToFeatureId(feature.getId());
        if (userFeatureId) {
          // Feature is a user-defined feature so update it in the Redux store
          updatedUserFeatures[userFeatureId] = createFeatureFromOpenLayers(
            feature
          ).points;
        }
      }

      if (!isEmpty(updatedUserFeatures)) {
        dispatch(updateFeatureCoordinates(updatedUserFeatures));
      }
    },
  })
)(FeaturesLayerPresentation);

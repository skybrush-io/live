import Color from 'color'
import { unary } from 'lodash'
import { Feature, geom, layer, source } from 'ol-react'
import PropTypes from 'prop-types'
import ol from 'openlayers'
import React from 'react'
import { connect } from 'react-redux'

import { FeatureType } from '../../../model/features'
import { featureIdToGlobalId } from '../../../model/identifiers'
import { getFeaturesInOrder, getSelectedFeatureIds } from '../../../selectors'
import { coordinateFromLonLat, euclideanDistance } from '../../../utils/geography'

// === Settings for this particular layer type ===

const FeaturesLayerSettingsPresentation = () => {
  return (
    <div>
      <p key="header">Waypoints, tracks and areas</p>
    </div>
  )
}

export const FeaturesLayerSettings = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(FeaturesLayerSettingsPresentation)

// === Helper functions ===

const geometryForFeature = feature => {
  const { points, type } = feature
  const coordinates = points.map(unary(coordinateFromLonLat))

  switch (type) {
    case FeatureType.CIRCLE:
      if (coordinates.length >= 2) {
        const center = coordinates[0]
        const radius = euclideanDistance(coordinates[0], coordinates[1])
        return <geom.Circle radius={radius}>{center}</geom.Circle>
      } else {
        return null
      }

    case FeatureType.POINTS:
      return (
        coordinates.length > 1
          ? <geom.MultiPoint>{coordinates}</geom.MultiPoint>
          : <geom.Point>{coordinates[0]}</geom.Point>
      )

    case FeatureType.LINE_STRING:
      return <geom.LineString>{coordinates}</geom.LineString>

    case FeatureType.POLYGON:
      return <geom.Polygon>{coordinates}</geom.Polygon>

    default:
      return null
  }
}

const fill = (color) => new ol.style.Fill({ color })
const thinOutline = (color) => new ol.style.Stroke({ color, width: 2 })
const thickOutline = (color) => new ol.style.Stroke({ color, width: 5 })
const whiteThinOutline = thinOutline('white')
const whiteThickOutline = thickOutline('white')
const whiteThickOutlineStyle = new ol.style.Style({ stroke: whiteThickOutline })

// TODO: cache the style somewhere?
const styleForFeature = (feature, selected = false) => {
  const { type, color } = feature
  const parsedColor = Color(color || '#0088ff')
  const styles = []

  switch (type) {
    case 'points':
      styles.push(new ol.style.Style({
        image: new ol.style.Circle({
          stroke: selected ? whiteThinOutline : undefined,
          fill: new ol.style.Fill({
            color: parsedColor.rgb().array()
          }),
          radius: 6
        })
      }))
      break

    case 'lineString':
      if (selected) {
        styles.push(whiteThickOutlineStyle)
      }
      styles.push(new ol.style.Style({
        stroke: thinOutline(parsedColor.rgb().array())
      }))
      break

    case 'polygon':
      // fallthrough

    default:
      styles.push(new ol.style.Style({
        fill: fill(parsedColor.fade(selected ? 0.5 : 0.75).rgb().array())
      }))
      if (selected) {
        styles.push(whiteThickOutlineStyle)
      }
      styles.push(new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: parsedColor.rgb().array(),
          width: 2
        })
      }))
  }

  if (feature.label && feature.label.length > 0) {
    styles.push(new ol.style.Style({
      text: new ol.style.Text({
        font: '12px sans-serif',
        text: feature.label,
        textAlign: 'center'
      })
    }))
  }

  return styles
}

const renderFeature = (feature, selected) => {
  const { id } = feature
  return (
    <Feature id={featureIdToGlobalId(id)} key={id} style={styleForFeature(feature, selected)}>
      {geometryForFeature(feature)}
    </Feature>
  )
}

// === The actual layer to be rendered ===

function markAsSelectable (layer) {
  layer.layer.set('selectable', true)
}

const FeaturesLayerPresentation = ({ features, projection, selectedFeatureIds, zIndex }) => (
  <layer.Vector updateWhileAnimating updateWhileInteracting zIndex={zIndex}
    ref={markAsSelectable}>
    <source.Vector>
      {features.map(feature =>
        renderFeature(feature, selectedFeatureIds.includes(feature.id))
      )}
    </source.Vector>
  </layer.Vector>
)

FeaturesLayerPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,
  projection: PropTypes.func.isRequired,
  zIndex: PropTypes.number,

  features: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedFeatureIds: PropTypes.arrayOf(PropTypes.string).isRequired
}

FeaturesLayerPresentation.defaultProps = {
  projection: coordinateFromLonLat
}

export const FeaturesLayer = connect(
  // mapStateToProps
  (state, ownProps) => ({
    features: getFeaturesInOrder(state),
    selectedFeatureIds: getSelectedFeatureIds(state)
  }),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(FeaturesLayerPresentation)

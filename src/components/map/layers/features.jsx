import Color from 'color'
import { Feature, geom, layer, source } from 'ol-react'
import PropTypes from 'prop-types'
import ol from 'openlayers'
import React from 'react'
import { connect } from 'react-redux'

import { getFeaturesInOrder, getSelectedFeatureIds } from '../../../selectors'
import { coordinateFromLonLat } from '../../../utils/geography'

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
  const coordinates = points.map(point => coordinateFromLonLat([point.lon, point.lat]))

  switch (type) {
    // TODO: points and point sets
    case 'points': return (
      coordinates.length > 1
        ? <geom.MultiPoint>{coordinates}</geom.MultiPoint>
        : <geom.Point>{coordinates[0]}</geom.Point>
    )

    case 'lineString': return <geom.LineString>{coordinates}</geom.LineString>
    case 'polygon': return <geom.Polygon>{coordinates}</geom.Polygon>
    default: return null
  }
}

// TODO: cache the style somewhere?
const styleForFeature = (feature, selected = false) => {
  const { type, color } = feature
  const parsedColor = Color(color || '#0088ff')

  switch (type) {
    case 'points':
      return new ol.style.Style({
        image: new ol.style.Circle({
          stroke: new ol.style.Stroke({
            color: parsedColor.mix(Color('black'), 0.5).rgb().array(),
            width: 2 + (selected ? 2 : 0)
          }),
          fill: new ol.style.Fill({
            color: parsedColor.rgb().array()
          }),
          radius: 6 + (selected ? 4 : 0)
        })
      })

    case 'lineString':
      // fallthrough

    case 'polygon':
      // fallthrough

    default:
      return {
        stroke: {
          color: parsedColor.rgb().array(),
          width: 1 + (selected ? 2 : 0)
        },
        fill: {
          color: parsedColor.fade(selected ? 0.5 : 0.75).rgb().array()
        }
      }
  }
}

const renderFeature = (feature, selected) => {
  const { id } = feature
  return (
    <Feature id={'feature$' + id} key={id} style={styleForFeature(feature, selected)}>
      {geometryForFeature(feature)}
    </Feature>
  )
}

// === The actual layer to be rendered ===

const FeaturesLayerPresentation = ({ features, projection, zIndex }) => (
  <layer.Vector updateWhileAnimating updateWhileInteracting zIndex={zIndex}>
    <source.Vector>
      {features.map(feature => renderFeature(feature))}
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

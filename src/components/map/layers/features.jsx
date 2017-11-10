import Color from 'color'
import { Feature, geom, layer, source } from 'ol-react'
import PropTypes from 'prop-types'
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
    case 'path': return <geom.LineString>{coordinates}</geom.LineString>
    case 'polygon': return <geom.Polygon>{coordinates}</geom.Polygon>
    default: return null
  }
}

// TODO: cache the style somewhere?
const styleForFeature = (feature, selected = false) => {
  const parsedColor = Color(feature.color || '#0088ff')
  return ({
    stroke: {
      color: parsedColor.rgb().array(),
      width: selected ? 3 : 1
    },
    fill: {
      color: parsedColor.fade(selected ? 0.5 : 0.75).rgb().array()
    }
  })
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

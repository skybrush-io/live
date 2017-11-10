import Color from 'color'
import { Feature, geom, layer, source } from 'ol-react'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import { getFeaturesInOrder } from '../../../selectors'
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

const styleForFeature = feature => {
  const parsedColor = Color(feature.color || '#0088ff')
  console.log(parsedColor.rgb().array())
  return ({
    stroke: {
      color: parsedColor.rgb().array(),
      width: 2
    },
    fill: {
      color: parsedColor.fade(0.5).rgb().array()
    }
  })
}

const renderFeature = feature => {
  const { id } = feature
  return (
    <Feature id={id} key={id} style={styleForFeature(feature)}>
      {geometryForFeature(feature)}
    </Feature>
  )
}

// === The actual layer to be rendered ===

const FeaturesLayerPresentation = ({ features, projection, zIndex }) => (
  <layer.Vector updateWhileAnimating updateWhileInteracting zIndex={zIndex}>
    <source.Vector>
      {features && features.map(renderFeature)}
    </source.Vector>
  </layer.Vector>
)

FeaturesLayerPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,
  projection: PropTypes.func.isRequired,
  zIndex: PropTypes.number,

  features: PropTypes.arrayOf(PropTypes.object)
}

FeaturesLayerPresentation.defaultProps = {
  projection: coordinateFromLonLat
}

export const FeaturesLayer = connect(
  // mapStateToProps
  (state, ownProps) => ({
    features: getFeaturesInOrder(state)
  }),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(FeaturesLayerPresentation)

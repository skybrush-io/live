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

// === The actual layer to be rendered ===

const FeaturesLayerPresentation = ({ features, projection, zIndex }) => (
  <layer.Vector updateWhileAnimating updateWhileInteracting zIndex={zIndex}>
    <source.Vector>
      {features && features.map(({ id, points }) => (
        <Feature id={id} key={id}>
          <geom.LineString>
            {
              points.map(point => coordinateFromLonLat([point.lon, point.lat]))
            }
          </geom.LineString>
        </Feature>
      ))}
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

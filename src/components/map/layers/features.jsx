import { Feature, geom, layer, source } from 'ol-react'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import { getFeaturesInOrder } from '../../../selectors'

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

const FeaturesLayerPresentation = ({ features, zIndex }) => (
  <layer.Vector updateWhileAnimating updateWhileInteracting zIndex={zIndex}>
    <source.Vector>
      {features && features.map(({ id }) => (
        <Feature id={id} key={id}>
          <geom.LineString>
            {[]}
          </geom.LineString>
        </Feature>
      ))}
    </source.Vector>
  </layer.Vector>
)

FeaturesLayerPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,
  zIndex: PropTypes.number,

  features: PropTypes.arrayOf(PropTypes.object)
}

export const FeaturesLayer = connect(
  // mapStateToProps
  (state, ownProps) => ({
    features: getFeaturesInOrder(state)
  }),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(FeaturesLayerPresentation)

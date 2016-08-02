import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import { layer } from 'ol-react'
import ActiveUAVsLayerSource from '../ActiveUAVsLayerSource'
import flock from '../../../flock'
import ol from 'openlayers'

// === Settings for this particular layer type ===

class UAVsLayerSettingsPresentation extends React.Component {
  render () {
    return (
      <div>
        <p key="header">UAV Settings:</p>
        <p>Coloring and stuff...</p>
      </div>
    )
  }
}

export const UAVsLayerSettings = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(UAVsLayerSettingsPresentation)

UAVsLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object
}

// === The actual layer to be rendered ===

const coordinateFromLonLat = coords => (
  // EPSG:3857 is Spherical Mercator projection, as used by most tile-based
  // mapping services
  ol.proj.fromLonLat(coords, 'EPSG:3857')
)

class UAVsLayerPresentation extends React.Component {
  render () {
    return (
      <div>
        <layer.Vector ref={this.context.assignActiveUAVsLayerRef_}
          updateWhileAnimating={true}
          updateWhileInteracting={true}
          zIndex={this.props.zIndex}>

          <ActiveUAVsLayerSource ref={this.context.assignActiveUAVsLayerSourceRef_}
            selection={this.props.selection}
            flock={flock}
            projection={this.props.projection} />

        </layer.Vector>
      </div>
    )
  }
}

UAVsLayerPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,
  zIndex: PropTypes.number,

  selection: PropTypes.arrayOf(PropTypes.string).isRequired,
  projection: PropTypes.func.isRequired
}

UAVsLayerPresentation.defaultProps = {
  projection: coordinateFromLonLat
}

UAVsLayerPresentation.contextTypes = {
  assignActiveUAVsLayerRef_: PropTypes.func,
  assignActiveUAVsLayerSourceRef_: PropTypes.func
}

export const UAVsLayer = connect(
  // mapStateToProps
  (state, ownProps) => ({
    selection: state.map.selection
  }),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(UAVsLayerPresentation)

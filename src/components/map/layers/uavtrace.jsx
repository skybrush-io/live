import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import TextField from 'material-ui/TextField'
import RaisedButton from 'material-ui/RaisedButton'

import { setLayerParameterById } from '../../../actions/layers'

import ol from 'openlayers'
import { layer, source } from 'ol-react'
import flock from '../../../flock'
import { coordinateFromLonLat } from '../MapView'

/**
 * Helper function that creates an OpenLayers stroke style object from a color.
 *
 * @param {color} color the color of the stroke line
 * @return {Object} the OpenLayers style object
 */
const makeStrokeStyle = color => new ol.style.Style({
  stroke: new ol.style.Stroke({ color: color })
})

// === Settings for this particular layer type ===

class UAVTraceLayerSettingsPresentation extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      trailLength: this.props.layer.parameters.trailLength
    }

    this.handleClick_ = this.handleClick_.bind(this)
  }

  render () {
    return (
      <div>
        <p key="header">Settings of the UAV trace lines:</p>
        <TextField ref="trailLength"
          floatingLabelText="Length of the trail"
          hintText="Length"
          type="number"
          defaultValue={this.props.layer.parameters.trailLength} />
        <p>
          Trail color:
          <input ref="trailColor"
            type="color"
            defaultValue={this.props.layer.parameters.trailColor} />
        </p>
        <br />
        <RaisedButton
          label="Set parameters"
          onClick={this.handleClick_} />
      </div>
    )
  }

  handleClick_ () {
    this.props.setLayerParameter('trailLength', this.refs.trailLength.getValue())
    this.props.setLayerParameter('trailColor', this.refs.trailColor.value)
  }
}

UAVTraceLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,

  setLayerParameter: PropTypes.func
}

export const UAVTraceLayerSettings = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    setLayerParameter: (parameter, value) => {
      dispatch(setLayerParameterById(ownProps.layerId, parameter, value))
    }
  })
)(UAVTraceLayerSettingsPresentation)

// === The actual layer to be rendered ===

class UAVTraceVectorSource extends source.Vector {
  constructor (props) {
    super(props)
    this.lineStringsById = {}

    this.handleUpdate_ = this.handleUpdate_.bind(this)

    flock.uavsUpdated.add(this.handleUpdate_)

    window.sor = this.source
  }

  handleUpdate_ (uavs) {
    for (const uav of uavs) {
      if (uav._id in this.lineStringsById) {
        this.lineStringsById[uav._id].appendCoordinate(
          coordinateFromLonLat([uav.lon, uav.lat])
        )
      } else {
        this.lineStringsById[uav._id] = new ol.geom.LineString(
          [coordinateFromLonLat([uav.lon, uav.lat])]
        )
        let feature = new ol.Feature(this.lineStringsById[uav._id])
        feature.setStyle(makeStrokeStyle(this.props.trailColor))
        this.source.addFeature(feature)
      }

      while (this.lineStringsById[uav._id].getCoordinates().length > this.props.trailLength) {
        this.lineStringsById[uav._id].setCoordinates(
          this.lineStringsById[uav._id].getCoordinates().slice(1)
        )
      }
    }
  }

  componentWillReceiveProps (newProps) {
    const features = this.source.getFeatures()

    for (const feature of features) {
      feature.setStyle(makeStrokeStyle(newProps.trailColor))
    }
  }
}

class UAVTraceLayerPresentation extends React.Component {
  render () {
    if (!this.props.layer.visible) {
      return false
    }

    return (
      <div>
        <layer.Vector zIndex={this.props.zIndex}
          updateWhileAnimating={true}
          updateWhileInteracting={true}>
          <UAVTraceVectorSource
            trailLength={this.props.layer.parameters.trailLength}
            trailColor={this.props.layer.parameters.trailColor} />
        </layer.Vector>
      </div>
    )
  }
}

UAVTraceLayerPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,
  zIndex: PropTypes.number
}

export const UAVTraceLayer = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(UAVTraceLayerPresentation)

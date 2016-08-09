import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import TextField from 'material-ui/TextField'
import RaisedButton from 'material-ui/RaisedButton'

import { setLayerParameterById } from '../../../actions/layers'

import ol from 'openlayers'
import { layer, source } from 'ol-react'
import flock from '../../../flock'
import { coordinateFromLonLat } from '../MapView'

// === Settings for this particular layer type ===

class UAVTraceLayerSettingsPresentation extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      trailLength: this.props.layer.parameters.trailLength
    }

    this.handleChange_ = this.handleChange_.bind(this)
    this.handleClick_ = this.handleClick_.bind(this)
  }

  render () {
    return (
      <div>
        <p key="header">Settings of the UAV trace lines:</p>
        <TextField ref="trailLength"
          floatingLabelText="Length of the trail"
          hintText="Length"
          defaultValue={this.props.layer.parameters.trailLength}
          onChange={this.handleChange_} />
        <br />
        <RaisedButton
          label="Set parameters"
          onClick={this.handleClick_} />
      </div>
    )
  }

  handleChange_ (e) {
    this.setState({
      trailLength: e.target.value
    })
  }

  handleClick_ () {
    this.props.setLayerParameter('trailLength', this.state.trailLength)
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

    // this.uavLocationHistory = {}

    this.featuresById = {}

    this.handleAdd_ = this.handleAdd_.bind(this)
    this.handleUpdate_ = this.handleUpdate_.bind(this)

    flock.uavsAdded.add(this.handleAdd_)
    flock.uavsUpdated.add(this.handleUpdate_)
  }

  handleAdd_ (uavs) {
    // for (const uav of uavs) {
    //   this.uavLocationHistory[uav._id] = [{
    //     lat: uav.lat,
    //     lon: uav.lon,
    //     heading: uav.heading
    //   }]
    // }

    for (const uav of uavs) {
      this.featuresById[uav._id] = []
    }
  }

  handleUpdate_ (uavs) {
    // for (const uav of uavs) {
    //   this.uavLocationHistory[uav._id].push({
    //     lat: uav.lat,
    //     lon: uav.lon,
    //     heading: uav.heading
    //   })
    // }

    for (const uav of uavs) {
      const currentFeature = new ol.Feature(new ol.geom.Point(
        coordinateFromLonLat([uav.lon, uav.lat])
      ))

      if (!(uav._id in this.featuresById)) {
        this.featuresById[uav._id] = []
      }

      this.featuresById[uav._id].push(currentFeature)

      this.source.addFeature(currentFeature)
    }

    for (const id in this.featuresById) {
      while (this.featuresById[id].length > this.props.trailLength) {
        this.source.removeFeature(this.featuresById[id].shift())
      }
    }
  }

  componentWillReceiveProps (newProps) {

  }
}

class UAVTraceLayerPresentation extends React.Component {
  render () {
    if (!this.props.layer.visible) {
      return false
    }

    return (
      <div>
        <layer.Vector zIndex={this.props.zIndex}>
          <UAVTraceVectorSource trailLength={this.props.layer.parameters.trailLength}/>
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

import _ from 'lodash'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import TextField from 'material-ui/TextField'
import PopupColorPicker from '../../PopupColorPicker'
import RaisedButton from 'material-ui/RaisedButton'

import { setLayerParameterById } from '../../../actions/layers'

import ol from 'openlayers'
import { layer, source } from 'ol-react'
import flock from '../../../flock'
import { coordinateFromLonLat } from '../../../utils/geography'
import { colorToString } from '../../../utils/coloring.js'

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
        <TextField ref={'trailLength'}
          floatingLabelText={'Length of the trail'}
          hintText={'Length (in samples)'}
          type={'number'}
          defaultValue={this.props.layer.parameters.trailLength} />
        <TextField ref={'trailWidth'}
          floatingLabelText={'Width of the trail'}
          hintText={'Width (in pixels)'}
          type={'number'}
          defaultValue={this.props.layer.parameters.trailWidth} />
        <div style={{marginTop: '15px'}}>
          Trail color:&nbsp;
          <PopupColorPicker ref={'trailColor'}
            defaultValue={this.props.layer.parameters.trailColor} />
        </div>
        <br />
        <RaisedButton
          label={'Set parameters'}
          onClick={this.handleClick_} />
      </div>
    )
  }

  handleClick_ () {
    this.props.setLayerParameter('trailLength', _.toNumber(this.refs.trailLength.getValue()))
    this.props.setLayerParameter('trailWidth', _.toNumber(this.refs.trailWidth.getValue()))
    this.props.setLayerParameter('trailColor', this.refs.trailColor.getValue())
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

/**
 * Helper function that creates an OpenLayers stroke style object from a color
 * and a given width.
 *
 * @param {Object} color the color of the stroke line
 * @param {number} width the width of the stroke line
 * @return {Object} the OpenLayers style object
 */
const makeStrokeStyle = (color, width) => new ol.style.Style({
  stroke: new ol.style.Stroke({ color, width })
})

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
        feature.setStyle(makeStrokeStyle(this.props.trailColor, this.props.trailWidth))
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
      feature.setStyle(makeStrokeStyle(newProps.trailColor, this.props.trailWidth))
    }
  }
}

UAVTraceVectorSource.propTypes = {
  trailLength: PropTypes.number,
  trailColor: PropTypes.string,
  trailWidth: PropTypes.number
}

class UAVTraceLayerPresentation extends React.Component {
  render () {
    if (!this.props.layer.visible) {
      return false
    }

    return (
      <div>
        <layer.Vector zIndex={this.props.zIndex}
          updateWhileAnimating
          updateWhileInteracting>
          <UAVTraceVectorSource
            trailLength={this.props.layer.parameters.trailLength}
            trailColor={colorToString(this.props.layer.parameters.trailColor)}
            trailWidth={this.props.layer.parameters.trailWidth} />
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

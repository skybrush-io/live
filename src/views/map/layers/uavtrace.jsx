import { autobind } from 'core-decorators'
import { toNumber } from 'lodash'
import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import { Stroke, Style } from 'ol/style'
import { layer, source } from '@collmot/ol-react'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import TextField from '@material-ui/core/TextField'

import { setLayerParametersById } from '../../../actions/layers'
import CircleColorPicker from '../../../components/CircleColorPicker'
import flock from '../../../flock'
import { coordinateFromLonLat } from '../../../utils/geography'
import { colorToString } from '../../../utils/coloring'
import { primaryColor } from '../../../utils/styles'

// === Settings for this particular layer type ===

class UAVTraceLayerSettingsPresentation extends React.Component {
  render () {
    const { layer } = this.props
    const parameters = {
      trailColor: primaryColor,
      trailLength: 10,
      trailWidth: 2,
      ...layer.parameters
    }
    const { trailColor, trailLength, trailWidth } = parameters

    return (
      <div>
        <TextField style={{ paddingRight: '1em', width: 150 }}
          label='Trail length' placeholder='Samples'
          type='number'
          value={trailLength} onChange={this._onTrailLengthChanged} />
        <TextField style={{ paddingRight: '1em', width: 150 }}
          label='Trail width' placeholder='Pixels'
          type='number'
          value={trailWidth} onChange={this._onTrailWidthChanged} />
        <div style={{ paddingTop: '0.5em' }}>
          <CircleColorPicker color={trailColor || primaryColor}
            onChangeComplete={this._onColorChanged} />
        </div>
      </div>
    )
  }

  @autobind
  _onColorChanged (color) {
    this.props.setLayerParameters({
      trailColor: color.hex
    })
  }

  @autobind
  _onTrailLengthChanged (event) {
    const value = toNumber(event.target.value)
    if (value > 0 && isFinite(value)) {
      this.props.setLayerParameters({
        trailLength: value
      })
    }
  }

  @autobind
  _onTrailWidthChanged (event) {
    const value = toNumber(event.target.value)
    if (value > 0 && value < 20) {
      this.props.setLayerParameters({
        trailWidth: value
      })
    }
  }
}

UAVTraceLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,

  setLayerParameters: PropTypes.func
}

export const UAVTraceLayerSettings = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    setLayerParameters: parameters => {
      dispatch(setLayerParametersById(ownProps.layerId, parameters))
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
const makeStrokeStyle = (color, width) => new Style({
  stroke: new Stroke({ color, width })
})

class UAVTraceVectorSource extends React.Component {
  constructor (props) {
    super(props)

    this.features = []
    this.lineStringsById = {}

    this._sourceRef = undefined

    flock.uavsUpdated.add(this._handleUpdate)
  }

  @autobind
  _assignSourceRef (value) {
    if (value === this._sourceRef) {
      return
    }

    if (this._sourceRef) {
      this._sourceRef.source.clear()
    }

    this._sourceRef = value

    if (this._sourceRef) {
      this._sourceRef.source.addFeatures(this.features)
    }
  }

  @autobind
  _handleUpdate (uavs) {
    for (const uav of uavs) {
      if (uav._id in this.lineStringsById) {
        // UAV exists, just extend its trace
        this.lineStringsById[uav._id].appendCoordinate(
          coordinateFromLonLat([uav.lon, uav.lat])
        )
      } else {
        // UAV does not exist yet, add a new trace
        this.lineStringsById[uav._id] = new LineString(
          [coordinateFromLonLat([uav.lon, uav.lat])]
        )
        this._registerNewFeature(new Feature(this.lineStringsById[uav._id]))
      }

      // Forget old coordinates from the trace
      while (this.lineStringsById[uav._id].getCoordinates().length > this.props.trailLength) {
        this.lineStringsById[uav._id].setCoordinates(
          this.lineStringsById[uav._id].getCoordinates().slice(1)
        )
      }
    }
  }

  @autobind
  _registerNewFeature (feature) {
    feature.setStyle(makeStrokeStyle(this.props.trailColor, this.props.trailWidth))

    this.features.push(feature)
    if (this._sourceRef) {
      this._sourceRef.source.addFeature(feature)
    }
  }

  componentDidUpdate () {
    if (this._sourceRef) {
      const features = this._sourceRef.source.getFeatures()

      // Update the styles of all the features
      for (const feature of features) {
        feature.setStyle(makeStrokeStyle(this.props.trailColor, this.props.trailWidth))
      }
    }
  }

  render () {
    return (
      <source.Vector ref={this._assignSourceRef} />
    )
  }
}

UAVTraceVectorSource.propTypes = {
  trailLength: PropTypes.number,
  trailColor: PropTypes.string,
  trailWidth: PropTypes.number
}

class UAVTraceLayerPresentation extends React.Component {
  render () {
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

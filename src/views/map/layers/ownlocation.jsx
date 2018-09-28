import { autobind } from 'core-decorators'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import { Icon, Style } from 'ol/style'

import { Geolocation, layer, source } from '@collmot/ol-react'

import makeLogger from '../../../utils/logging'

const logger = makeLogger('OwnLocationLayer')

// === Settings for this particular layer type ===

class OwnLocationLayerSettingsPresentation extends React.Component {
  render () {
    return false
  }
}

OwnLocationLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string
}

export const OwnLocationLayerSettings = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(OwnLocationLayerSettingsPresentation)

// === The actual layer to be rendered ===

class OwnLocationVectorSource extends React.Component {
  constructor (props) {
    super(props)

    this._sourceRef = undefined

    this.locationIcon = new Icon({
      rotateWithView: true,
      rotation: 0,
      snapToPixel: false,
      /* Path should not have a leading slash otherwise it won't work in Electron */
      src: 'assets/location.32x32.png'
    })

    this.locationFeature = new Feature()
    this.locationFeature.setStyle(
      new Style({ image: this.locationIcon })
    )

    this.accuracyFeature = new Feature()
  }

  componentDidMount () {
    if (window.DeviceOrientationEvent) {
      window.addEventListener(
        'deviceorientation',
        this._onDeviceOrientationChange
      )
    }
  }

  componentWillUnmount () {
    if (window.DeviceOrientationEvent) {
      window.removeEventListener(
        'deviceorientation',
        this._onDeviceOrientationChange
      )
    }
  }

  @autobind
  _assignSourceRef (value) {
    if (this._sourceRef === value) {
      return
    }

    if (this._sourceRef) {
      const { source } = this._sourceRef
      source.removeFeature(this.locationFeature)
      source.removeFeature(this.accuracyFeature)
    }

    this._sourceRef = value

    if (this._sourceRef) {
      const { source } = this._sourceRef
      source.addFeature(this.locationFeature)
      source.addFeature(this.accuracyFeature)
    }
  }

  @autobind
  _logError (event) {
    this.props.onError(`Error while getting position: ${event.message}`)
  }

  @autobind
  _onPositionChange (event) {
    const coordinates = event.target.getPosition()
    this.locationFeature.setGeometry(coordinates ? new Point(coordinates) : null)
  }

  @autobind
  _onAccuracyGeometryChange (event) {
    const accuracyGeometry = event.target.getAccuracyGeometry()
    this.accuracyFeature.setGeometry(accuracyGeometry)
  }

  @autobind
  _onDeviceOrientationChange (event) {
    this.locationIcon.setRotation(-event.alpha / 180 * Math.PI)

    if (this._sourceRef) {
      this._sourceRef.source.refresh()
    }
  }

  // @autobind
  // _onHeadingChange (event) {
  //   this.locationIcon.setRotation(-event.target.getHeading())

  //   if (this._sourceRef) {
  //     this._sourceRef.source.refresh()
  //   }
  // }

  render () {
    return [
      <Geolocation
        key='location'
        changePosition={this._onPositionChange}
        changeAccuracyGeometry={this._onAccuracyGeometryChange}
        projection='EPSG:3857'
        error={this._logError}
      />,
      // <DeviceOrientation
      //   key='orientation'
      //   changeHeading={this._onHeadingChange}
      // />,
      <source.Vector key='source' ref={this._assignSourceRef} />
    ]
  }
}

OwnLocationVectorSource.propTypes = {
  onError: PropTypes.func
}

const OwnLocationLayerPresentation = ({ onError, zIndex }) => (
  <layer.Vector zIndex={zIndex} updateWhileAnimating updateWhileInteracting>
    <OwnLocationVectorSource onError={onError} />
  </layer.Vector>
)

OwnLocationLayerPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,
  onError: PropTypes.func,
  zIndex: PropTypes.number
}

export const OwnLocationLayer = connect(
  // mapStateToProps
  state => ({}),
  // mapDispatchToProps
  dispatch => ({
    onError: logger.warn
  })
)(OwnLocationLayerPresentation)

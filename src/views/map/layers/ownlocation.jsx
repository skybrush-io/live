import { autobind } from 'core-decorators'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import Feature from 'ol/feature'
import Point from 'ol/geom/point'
import Icon from 'ol/style/icon'
import Style from 'ol/style/style'

import { DeviceOrientation, Geolocation, layer, source } from 'ol-react'

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

class OwnLocationVectorSource extends source.Vector {
  constructor (props, context) {
    super(props)

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
    this.source.addFeature(this.locationFeature)

    this.accuracyFeature = new Feature()
    this.source.addFeature(this.accuracyFeature)
  }

  _logError () {
    console.log('error while getting position')
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
  _onHeadingChange (event) {
    this.locationIcon.setRotation(-event.target.getHeading())
    this.source.refresh()
  }

  render () {
    return [
      <Geolocation key='location' changePosition={this._onPositionChange}
        changeAccuracyGeometry={this._onAccuracyGeometryChange}
        error={this._logError} />,
      <DeviceOrientation key='orientation' changeHeading={this._onHeadingChange} />
    ]
  }
}

class OwnLocationLayerPresentation extends React.Component {
  render () {
    return (
      <layer.Vector zIndex={this.props.zIndex}
        updateWhileAnimating
        updateWhileInteracting>
        <OwnLocationVectorSource />
      </layer.Vector>
    )
  }
}

OwnLocationLayerPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,
  zIndex: PropTypes.number
}

export const OwnLocationLayer = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(OwnLocationLayerPresentation)

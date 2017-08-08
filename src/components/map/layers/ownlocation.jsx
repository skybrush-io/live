import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import ol from 'openlayers'
import { layer, source } from 'ol-react'

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

    this._onPositionChange = this._onPositionChange.bind(this)
    this._onAccuracyGeometryChange = this._onAccuracyGeometryChange.bind(this)
    this._onHeadingChange = this._onHeadingChange.bind(this)

    this.locationIcon = new ol.style.Icon({
      rotateWithView: true,
      rotation: 0,
      snapToPixel: false,
      src: '/assets/location.32x32.png'
    })

    this.locationFeature = new ol.Feature()
    this.locationFeature.setStyle(
      new ol.style.Style({ image: this.locationIcon })
    )
    this.source.addFeature(this.locationFeature)

    this.accuracyFeature = new ol.Feature()
    this.source.addFeature(this.accuracyFeature)

    this.olGeolocation = new ol.Geolocation({
      projection: context.map.getView().getProjection()
    })
    this.olGeolocation.on('change:position', this._onPositionChange)
    this.olGeolocation.on('change:accuracyGeometry', this._onAccuracyGeometryChange)
    this.olGeolocation.setTracking(true)

    let deviceOrientation = new ol.DeviceOrientation()
    deviceOrientation.on('change:alpha', this._onHeadingChange)
    deviceOrientation.setTracking(true)
  }

  _onPositionChange () {
    let coordinates = this.olGeolocation.getPosition()
    this.locationFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null)
  }

  _onAccuracyGeometryChange () {
    this.accuracyFeature.setGeometry(this.olGeolocation.getAccuracyGeometry())
  }

  _onHeadingChange (e) {
    this.locationIcon.setRotation(-e.target.getAlpha())
    this.source.refresh()
  }
}

class OwnLocationLayerPresentation extends React.Component {
  render () {
    if (!this.props.layer.visible) {
      return false
    }

    return (
      <div>
        <layer.Vector zIndex={this.props.zIndex}
          updateWhileAnimating
          updateWhileInteracting>
          <OwnLocationVectorSource />
        </layer.Vector>
      </div>
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

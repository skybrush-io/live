import { autobind } from 'core-decorators'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import Feature from 'ol/feature'
import Point from 'ol/geom/point'
import Icon from 'ol/style/icon'
import Style from 'ol/style/style'

import { layer, source } from 'ol-react'

// === Settings for this particular layer type ===

class HomePositionsLayerSettingsPresentation extends React.Component {
  render () {
    return false
  }
}

HomePositionsLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string
}

export const HomePositionsLayerSettings = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(HomePositionsLayerSettingsPresentation)

// === The actual layer to be rendered ===

class HomePositionsVectorSource extends source.Vector {
  constructor (props) {
    super(props)

    this.ownHomePositionIcon = new Icon({
      rotateWithView: true,
      rotation: 0,
      snapToPixel: false,
      /* Path should not have a leading slash otherwise it won't work in Electron */
      src: 'assets/location.32x32.png'
    })

    this.ownHomePositionFeature = new Feature()
    this.ownHomePositionFeature.setStyle(
      new Style({ image: this.ownHomePositionIcon })
    )
    this.source.addFeature(this.ownHomePositionFeature)
  }

  @autobind
  _onPositionChange (event) {
    const coordinates = event.target.getPosition()
    this.ownHomePositionFeature.setGeometry(coordinates ? new Point(coordinates) : null)
  }
}

const HomePositionsLayerPresentation = ({ zIndex }) => (
  <layer.Vector zIndex={zIndex} updateWhileAnimating updateWhileInteracting>
    <HomePositionsVectorSource />
  </layer.Vector>
)

HomePositionsLayerPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,
  zIndex: PropTypes.number
}

export const HomePositionsLayer = connect(
  // mapStateToProps
  state => ({}),
  // mapDispatchToProps
  dispatch => ({
  })
)(HomePositionsLayerPresentation)

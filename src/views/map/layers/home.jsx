import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import Circle from 'ol/style/circle'
import Icon from 'ol/style/icon'
import Style from 'ol/style/style'

import { Feature, geom, layer, source } from 'ol-react'

import { coordinateFromLonLat } from '../../../utils/geography'
import { fill, thinOutline } from '../../../utils/styles'

// === Settings for this particular layer type ===

class HomePositionsLayerSettingsPresentation extends React.Component {
  render () {
    return false
  }
}

HomePositionsLayerSettingsPresentation.propTypes = {
  homePosition: PropTypes.arrayOf(PropTypes.number),
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

const ownHomePositionStyle = new Style({
  image: new Circle({
    fill: fill('#f44'),
    stroke: thinOutline('white'),
    radius: 8
  })
})

class HomePositionsVectorSource extends source.Vector {
  render () {
    const features = []
    if (this.props.homePosition) {
      features.push(
        <Feature key="home" style={ownHomePositionStyle}>
          <geom.Point>{coordinateFromLonLat(this.props.homePosition)}</geom.Point>
        </Feature>
      )
    }
    return features
  }
}

const HomePositionsLayerPresentation = ({ homePosition, zIndex }) => (
  <layer.Vector zIndex={zIndex} updateWhileAnimating updateWhileInteracting>
    <HomePositionsVectorSource homePosition={homePosition} />
  </layer.Vector>
)

HomePositionsLayerPresentation.propTypes = {
  homePosition: PropTypes.arrayOf(PropTypes.number),
  layer: PropTypes.object,
  layerId: PropTypes.string,
  zIndex: PropTypes.number
}

export const HomePositionsLayer = connect(
  // mapStateToProps
  state => ({
    homePosition: state.map.origin.position
  }),
  // mapDispatchToProps
  dispatch => ({
  })
)(HomePositionsLayerPresentation)

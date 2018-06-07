import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import LineString from 'ol/geom/linestring'
import Circle from 'ol/style/circle'
import Style from 'ol/style/style'
import Text from 'ol/style/text'

import { Feature, geom, layer, source } from 'ol-react'

import { homePositionIdToGlobalId } from '../../../model/identifiers'
import { setLayerEditable, setLayerSelectable } from '../../../model/layers'
import { getSelectedHomePositionIds } from '../../../selectors'
import { coordinateFromLonLat } from '../../../utils/geography'
import { fill, stroke, whiteThickOutline, whiteThinOutline } from '../../../utils/styles'

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

function markAsSelectable (layer) {
  if (layer) {
    setLayerEditable(layer.layer)
    setLayerSelectable(layer.layer)
  }
}

const redLine = stroke('#f44', 2)

const ownHomePositionStyles = selected => [
  // circle
  new Style({
    image: new Circle({
      fill: fill('#f44'),
      radius: 8,
      stroke: selected ? whiteThickOutline : whiteThinOutline
    })
  }),

  // arrow
  new Style({
    geometry: feature => {
      const geom = feature.getGeometry()
      const origin = geom.getCoordinates()
      const angle = 0
      const angleInRad = angle * Math.PI / 180
      const end = [
        origin[0] + 40 * Math.cos(angleInRad),
        origin[1] + 40 * Math.sin(angleInRad)
      ]
      return new LineString([origin, end])
    },
    stroke: redLine
  }),

  // text
  new Style({
    text: new Text({
      font: '12px sans-serif',
      offsetY: 16,
      text: 'Origin',
      textAlign: 'center'
    })
  })
]

class HomePositionsVectorSource extends source.Vector {
  render () {
    const { homePosition, selectedIds } = this.props
    const features = []
    if (this.props.homePosition) {
      features.push(
        <Feature id={homePositionIdToGlobalId('')} key=''
          style={ownHomePositionStyles(selectedIds.includes(''))}>
          <geom.Point>{coordinateFromLonLat(homePosition)}</geom.Point>
        </Feature>
      )
    }
    return features
  }
}

const HomePositionsLayerPresentation = ({ homePosition, selectedIds, zIndex }) => (
  <layer.Vector zIndex={zIndex} updateWhileAnimating updateWhileInteracting
    ref={markAsSelectable}>
    <HomePositionsVectorSource homePosition={homePosition} selectedIds={selectedIds} />
  </layer.Vector>
)

HomePositionsLayerPresentation.propTypes = {
  homePosition: PropTypes.arrayOf(PropTypes.number),
  layer: PropTypes.object,
  layerId: PropTypes.string,
  selectedIds: PropTypes.arrayOf(PropTypes.string),
  zIndex: PropTypes.number
}

export const HomePositionsLayer = connect(
  // mapStateToProps
  state => ({
    homePosition: state.map.origin.position,
    selectedIds: getSelectedHomePositionIds(state)
  }),
  // mapDispatchToProps
  dispatch => ({
  })
)(HomePositionsLayerPresentation)

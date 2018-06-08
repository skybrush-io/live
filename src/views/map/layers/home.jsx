import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import Coordinate from 'ol/coordinate'
import Point from 'ol/geom/point'
import Circle from 'ol/style/circle'
import Style from 'ol/style/style'
import Text from 'ol/style/text'

import { Feature, geom, layer, source } from 'ol-react'

import { homePositionIdToGlobalId } from '../../../model/identifiers'
import { setLayerEditable, setLayerSelectable } from '../../../model/layers'
import { getSelectedHomePositionIds } from '../../../selectors/selection'
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
  // circle and label
  new Style({
    geometry: feature => {
      const geom = feature.getGeometry()
      const origin = geom.getFirstCoordinate()
      return new Point(origin)
    },
    image: new Circle({
      fill: fill('#f44'),
      radius: 8,
      stroke: selected ? whiteThickOutline : whiteThinOutline
    }),
    text: new Text({
      font: '12px sans-serif',
      offsetY: 16,
      text: 'Origin',
      textAlign: 'center'
    })
  }),

  // arrow
  new Style({
    stroke: redLine
  })
]

class HomePositionsVectorSource extends source.Vector {
  render () {
    const { angle, homePosition, selectedIds } = this.props
    const features = []
    if (homePosition) {
      const tail = coordinateFromLonLat(homePosition)
      const head = [0, 50]
      Coordinate.rotate(head, -angle * Math.PI / 180)
      Coordinate.add(head, tail)
      features.push(
        <Feature id={homePositionIdToGlobalId('')} key=''
          style={ownHomePositionStyles(selectedIds.includes(''))}>
          <geom.LineString>{[tail, head]}</geom.LineString>
        </Feature>
      )
    }
    return features
  }
}

const HomePositionsLayerPresentation = ({ angle, homePosition, selectedIds, zIndex }) => (
  <layer.Vector zIndex={zIndex} updateWhileAnimating updateWhileInteracting
    ref={markAsSelectable}>
    <HomePositionsVectorSource homePosition={homePosition} angle={angle}
      selectedIds={selectedIds} />
  </layer.Vector>
)

HomePositionsLayerPresentation.propTypes = {
  angle: PropTypes.number,
  homePosition: PropTypes.arrayOf(PropTypes.number),
  layer: PropTypes.object,
  layerId: PropTypes.string,
  selectedIds: PropTypes.arrayOf(PropTypes.string),
  zIndex: PropTypes.number
}

HomePositionsLayerPresentation.defaultProps = {
  angle: 0
}

export const HomePositionsLayer = connect(
  // mapStateToProps
  state => ({
    homePosition: state.map.origin.position,
    angle: state.map.origin.angle,
    selectedIds: getSelectedHomePositionIds(state)
  }),
  // mapDispatchToProps
  dispatch => ({
  })
)(HomePositionsLayerPresentation)

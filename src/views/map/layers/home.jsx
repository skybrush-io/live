import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import Coordinate from 'ol/coordinate'
import Point from 'ol/geom/point'
import Circle from 'ol/style/circle'
import Style from 'ol/style/style'
import Text from 'ol/style/text'

import { Feature, geom, layer, source } from '@collmot/ol-react'

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
const greenLine = stroke('#4f4', 2)

const ownHomePositionStyles = (selected, axis) => [
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
    stroke: axis === 'x' ? redLine : greenLine
  })
]

const HomePositionsVectorSource = ({ angle, coordinateSystemType, homePosition, selectedIds }) => {
  const features = []

  if (homePosition) {
    const id = homePositionIdToGlobalId('')
    const tail = coordinateFromLonLat(homePosition)
    const headY = [0, 50]
    const headX = [coordinateSystemType === 'neu' ? 50 : -50, 0]
    Coordinate.rotate(headX, -angle * Math.PI / 180)
    Coordinate.rotate(headY, -angle * Math.PI / 180)
    Coordinate.add(headY, tail)
    Coordinate.add(headX, tail)
    features.push(
      <Feature id={id + '$x'} key='x'
        style={ownHomePositionStyles(selectedIds.includes(''), 'x')}>
        <geom.LineString coordinates={[tail, headX]} />
      </Feature>,
      <Feature id={id} key='y'
        style={ownHomePositionStyles(selectedIds.includes(''), 'y')}>
        <geom.LineString coordinates={[tail, headY]} />
      </Feature>
    )
  }

  return (
    <source.Vector>
      {features}
    </source.Vector>
  )
}

HomePositionsVectorSource.propTypes = {
  angle: PropTypes.number,
  coordinateSystemType: PropTypes.oneOf(['neu', 'nwu']),
  homePosition: PropTypes.arrayOf(PropTypes.number),
  selectedIds: PropTypes.arrayOf(PropTypes.string)
}

const HomePositionsLayerPresentation = ({
  angle, coordinateSystemType, homePosition, selectedIds, zIndex
}) => (
  <layer.Vector zIndex={zIndex} updateWhileAnimating updateWhileInteracting
    ref={markAsSelectable}>
    <HomePositionsVectorSource homePosition={homePosition} angle={angle}
      selectedIds={selectedIds} coordinateSystemType={coordinateSystemType} />
  </layer.Vector>
)

HomePositionsLayerPresentation.propTypes = {
  angle: PropTypes.number,
  coordinateSystemType: PropTypes.oneOf(['neu', 'nwu']),
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
    angle: state.map.origin.angle,
    coordinateSystemType: state.map.origin.type,
    homePosition: state.map.origin.position,
    selectedIds: getSelectedHomePositionIds(state)
  }),
  // mapDispatchToProps
  dispatch => ({
  })
)(HomePositionsLayerPresentation)

import Color from 'color'
import { unary } from 'lodash'
import { Feature, geom, interaction, layer, source } from 'ol-react'
import PropTypes from 'prop-types'
import Circle from 'ol/style/circle'
import Style from 'ol/style/style'
import Text from 'ol/style/text'
import React from 'react'
import { connect } from 'react-redux'

import { Tool } from '../tools'

import { FeatureType, LabelStyle } from '../../../model/features'
import { featureIdToGlobalId } from '../../../model/identifiers'
import { setLayerEditable, setLayerSelectable } from '../../../model/layers'
import { getFeaturesInOrder } from '../../../selectors/ordered'
import { getSelectedFeatureIds } from '../../../selectors/selection'
import { coordinateFromLonLat, euclideanDistance } from '../../../utils/geography'
import { fill, thinOutline, whiteThickOutline, whiteThinOutline } from '../../../utils/styles'

// === Settings for this particular layer type ===

const FeaturesLayerSettingsPresentation = () => <noscript />

export const FeaturesLayerSettings = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(FeaturesLayerSettingsPresentation)

// === Helper functions ===

const geometryForFeature = feature => {
  const { points, type } = feature
  const coordinates = points.map(unary(coordinateFromLonLat))

  switch (type) {
    case FeatureType.CIRCLE:
      if (coordinates.length >= 2) {
        const center = coordinates[0]
        const radius = euclideanDistance(coordinates[0], coordinates[1])
        return <geom.Circle radius={radius}>{center}</geom.Circle>
      } else {
        return null
      }

    case FeatureType.POINTS:
      return (
        coordinates.length > 1
          ? <geom.MultiPoint>{coordinates}</geom.MultiPoint>
          : <geom.Point>{coordinates[0]}</geom.Point>
      )

    case FeatureType.LINE_STRING:
      return <geom.LineString>{coordinates}</geom.LineString>

    case FeatureType.POLYGON:
      // OpenLayers requires the last coordinate to be the same as the first
      // one when a polygon is drawn
      if (coordinates.length > 0) {
        coordinates.push(coordinates[0])
      }
      return <geom.Polygon>{coordinates}</geom.Polygon>

    default:
      return null
  }
}

const whiteThickOutlineStyle = new Style({ stroke: whiteThickOutline })
const labelStrokes = {
  [LabelStyle.THIN_OUTLINE]: whiteThinOutline,
  [LabelStyle.THICK_OUTLINE]: whiteThickOutline
}

// TODO: cache the style somewhere?
const styleForFeature = (feature, selected = false) => {
  const { color, label, labelStyle, type } = feature
  const parsedColor = Color(color || '#0088ff')
  const styles = []
  const radius = 6

  switch (type) {
    case FeatureType.POINTS:
      styles.push(new Style({
        image: new Circle({
          stroke: selected ? whiteThinOutline : undefined,
          fill: fill(parsedColor.rgb().array()),
          radius
        })
      }))
      break

    case FeatureType.LINE_STRING:
      if (selected) {
        styles.push(whiteThickOutlineStyle)
      }
      styles.push(new Style({
        stroke: thinOutline(parsedColor.rgb().array())
      }))
      break

    case FeatureType.POLYGON:
      // fallthrough

    default:
      styles.push(new Style({
        fill: fill(parsedColor.fade(selected ? 0.5 : 0.75).rgb().array())
      }))
      if (selected) {
        styles.push(whiteThickOutlineStyle)
      }
      styles.push(new Style({
        stroke: thinOutline(parsedColor.rgb().array())
      }))
  }

  if (label && label.length > 0 && labelStyle !== LabelStyle.HIDDEN) {
    styles.push(new Style({
      text: new Text({
        font: '12px sans-serif',
        offsetY: type === 'points' ? radius + 10 : 0,
        placement: (type === 'lineString') ? 'line' : 'point',
        stroke: labelStrokes[labelStyle],
        text: label,
        textAlign: 'center'
      })
    }))
  }

  return styles
}

const renderFeature = (feature, selected) => {
  const { id } = feature
  return (
    <Feature id={featureIdToGlobalId(id)} key={id} style={styleForFeature(feature, selected)}>
      {geometryForFeature(feature)}
    </Feature>
  )
}

// === The actual layer to be rendered ===

function markAsSelectableAndEditable (layer) {
  if (layer) {
    setLayerEditable(layer.layer)
    setLayerSelectable(layer.layer)
  }
}

const FeaturesLayerPresentation = ({
  features, onFeaturesModified, projection, selectedFeatureIds,
  selectedTool, zIndex
}) => (
  <layer.Vector updateWhileAnimating updateWhileInteracting zIndex={zIndex}
    ref={markAsSelectableAndEditable}>
    <source.Vector>
      {features.filter(feature => feature.visible).map(feature =>
        renderFeature(feature, selectedFeatureIds.includes(feature.id))
      )}
      {selectedTool === Tool.EDIT_FEATURE
        ? <interaction.Modify modifyend={onFeaturesModified} />
        : null}
    </source.Vector>
  </layer.Vector>
)

FeaturesLayerPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,
  projection: PropTypes.func.isRequired,
  selectedTool: PropTypes.string,
  zIndex: PropTypes.number,

  features: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedFeatureIds: PropTypes.arrayOf(PropTypes.string).isRequired,

  onFeaturesModified: PropTypes.func
}

FeaturesLayerPresentation.defaultProps = {
  projection: coordinateFromLonLat
}

export const FeaturesLayer = connect(
  // mapStateToProps
  (state, ownProps) => ({
    features: getFeaturesInOrder(state),
    selectedFeatureIds: getSelectedFeatureIds(state)
  }),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(FeaturesLayerPresentation)

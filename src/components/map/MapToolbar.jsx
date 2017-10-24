import PropTypes from 'prop-types'
import React from 'react'

import IconButton from 'material-ui/IconButton'
import ActionPanTool from 'material-ui/svg-icons/action/pan-tool'
import ActionZoomIn from 'material-ui/svg-icons/action/zoom-in'
import ContentSelectAll from 'material-ui/svg-icons/content/select-all'
import MapsLayers from 'material-ui/svg-icons/maps/layers'

import MapRotationTextBox from './MapRotationTextBox'
import FitAllFeaturesButton from './FitAllFeaturesButton'

import partial from 'lodash/partial'
import { connect } from 'react-redux'

import { selectMapTool } from '../../actions/map'
import { showLayersDialog } from '../../actions/layers'
import { Tool } from './tools'

/**
 * Separator component for the toolbar
 *
 * @returns {Object} the rendered component
 */
const MapToolbarSeparator = () => {
  return (
    <div style={{
      display: 'inline-block',
      height: '48px',
      borderLeft: '1px solid rgba(0, 0, 0,  0.172549)',
      verticalAlign: 'top'
    }} />
  )
}

/**
 * Presentation component for the map toolbar.
 *
 * @returns {Object} the rendered component
 */
class MapToolbarPresentation extends React.Component {
  render () {
    const { selectedTool } = this.props
    const { onShowLayersDialog, onToolSelected } = this.props
    const { muiTheme } = this.context

    const selectedColor = muiTheme.palette.primary1Color
    const colorForTool = (tool) => (
      selectedTool === tool ? selectedColor : undefined
    )

    return (
      <div>
        <IconButton onClick={partial(onToolSelected, Tool.SELECT)} tooltip={'Select'}>
          <ContentSelectAll color={colorForTool(Tool.SELECT)} />
        </IconButton>
        <IconButton onClick={partial(onToolSelected, Tool.ZOOM)} tooltip={'Zoom'}>
          <ActionZoomIn color={colorForTool(Tool.ZOOM)} />
        </IconButton>
        <IconButton onClick={partial(onToolSelected, Tool.PAN)} tooltip={'Pan'}>
          <ActionPanTool color={colorForTool(Tool.PAN)} />
        </IconButton>

        <MapToolbarSeparator />

        <IconButton onClick={onShowLayersDialog} tooltip={'Layers'}>
          <MapsLayers />
        </IconButton>

        <MapToolbarSeparator />

        <MapRotationTextBox resetDuration={500} fieldWidth={'75px'}
          style={{
            display: 'inline-block',
            marginRight: '12px',
            verticalAlign: 'top'
          }} />

        <MapToolbarSeparator />

        <FitAllFeaturesButton duration={500} margin={64} />
      </div>
    )
  }
}

MapToolbarPresentation.propTypes = {
  visibleSource: PropTypes.string,
  selectedTool: PropTypes.string,
  onShowLayersDialog: PropTypes.func,
  onToolSelected: PropTypes.func
}

MapToolbarPresentation.contextTypes = {
  muiTheme: PropTypes.object
}

/**
 * Main toolbar on the map.
 */
const MapToolbar = connect(
  // mapStateToProps
  state => Object.assign({}, state.map.tools),
  // mapDispatchToProps
  dispatch => ({
    onShowLayersDialog () {
      dispatch(showLayersDialog())
    },
    onToolSelected (tool) {
      dispatch(selectMapTool(tool))
    }
  })
)(MapToolbarPresentation)

export default MapToolbar

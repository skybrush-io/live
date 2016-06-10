import React, { PropTypes } from 'react'

import IconButton from 'material-ui/IconButton'
import ActionPanTool from 'material-ui/svg-icons/action/pan-tool'
import ActionZoomIn from 'material-ui/svg-icons/action/zoom-in'
import ContentSelectAll from 'material-ui/svg-icons/content/select-all'

import partial from 'lodash/partial'
import { connect } from 'react-redux'

import { selectMapTool } from '../../actions/map'
import { Tool } from './tools'

/**
 * Presentation component for the map toolbar.
 *
 * @returns {Object} the rendered component
 */
const MapToolbarPresentation = ({ selectedTool, onToolSelected }, { muiTheme }) => {
  const selectedColor = muiTheme.palette.primary1Color
  const colorForTool = (tool) => (
    selectedTool === tool ? selectedColor : undefined
  )
  return (
    <div>
      <IconButton onClick={partial(onToolSelected, Tool.SELECT)}>
        <ContentSelectAll color={colorForTool(Tool.SELECT)} />
      </IconButton>
      <IconButton onClick={partial(onToolSelected, Tool.ZOOM)}>
        <ActionZoomIn color={colorForTool(Tool.ZOOM)} />
      </IconButton>
      <IconButton onClick={partial(onToolSelected, Tool.PAN)}>
        <ActionPanTool color={colorForTool(Tool.PAN)} />
      </IconButton>
    </div>
  )
}

MapToolbarPresentation.propTypes = {
  selectedTool: PropTypes.string,
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
  state => state.map.tools,
  // mapDispatchToProps
  dispatch => ({
    onToolSelected (tool) {
      dispatch(selectMapTool(tool))
    }
  })
)(MapToolbarPresentation)

export default MapToolbar

import PropTypes from 'prop-types'
import React from 'react'

import IconButton from 'material-ui/IconButton'
import muiThemeable from 'material-ui/styles/muiThemeable'
import CommunicationLocationOn from 'material-ui/svg-icons/communication/location-on'
import EditorShowChart from 'material-ui/svg-icons/editor/show-chart'
import ImagePanoramaFishEye from 'material-ui/svg-icons/image/panorama-fish-eye'
import ToggleStarBorder from 'material-ui/svg-icons/toggle/star-border'

import partial from 'lodash/partial'
import { connect } from 'react-redux'

import { selectMapTool } from '../../actions/map'
import { Tool } from './tools'

/**
 * Presentation component for the drawing toolbar.
 *
 * @return {React.Element} the rendered component
 */
const DrawingToolbarPresentation = ({ muiTheme, onToolSelected, selectedTool }) => {
  const selectedColor = muiTheme.palette.primary1Color
  const colorForTool = (tool) => (
    selectedTool === tool ? selectedColor : undefined
  )

  return (
    <div style={{ display: 'flex', flexFlow: 'column nowrap' }}>
      <IconButton onClick={partial(onToolSelected, Tool.DRAW_POINT)} tooltip='Add marker'>
        <CommunicationLocationOn color={colorForTool(Tool.DRAW_POINT)} />
      </IconButton>
      <IconButton onClick={partial(onToolSelected, Tool.DRAW_CIRCLE)} tooltip='Draw circle'>
        <ImagePanoramaFishEye color={colorForTool(Tool.DRAW_CIRCLE)} />
      </IconButton>
      <IconButton onClick={partial(onToolSelected, Tool.DRAW_PATH)} tooltip='Draw path'>
        <EditorShowChart color={colorForTool(Tool.DRAW_PATH)} />
      </IconButton>
      <IconButton onClick={partial(onToolSelected, Tool.DRAW_POLYGON)} tooltip='Draw polygon'>
        <ToggleStarBorder color={colorForTool(Tool.DRAW_POLYGON)} />
      </IconButton>
    </div>
  )
}

DrawingToolbarPresentation.propTypes = {
  muiTheme: PropTypes.object,
  onToolSelected: PropTypes.func,
  selectedTool: PropTypes.string
}

/**
 * Drawing toolbar on the map.
 */
const DrawingToolbar = connect(
  // mapStateToProps
  state => ({ ...state.map.tools }),
  // mapDispatchToProps
  dispatch => ({
    onToolSelected (tool) {
      dispatch(selectMapTool(tool))
    }
  })
)(
  muiThemeable()(DrawingToolbarPresentation)
)

export default DrawingToolbar

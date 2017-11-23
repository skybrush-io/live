import PropTypes from 'prop-types'
import React from 'react'

import IconButton from 'material-ui/IconButton'
import withTheme from 'material-ui/styles/withTheme'
import CommunicationLocationOn from 'material-ui-icons/LocationOn'
import EditorShowChart from 'material-ui-icons/ShowChart'
import ImagePanoramaFishEye from 'material-ui-icons/PanoramaFishEye'
import ToggleStarBorder from 'material-ui-icons/StarBorder'

import partial from 'lodash/partial'
import { connect } from 'react-redux'

import { selectMapTool } from '../../actions/map'
import { Tool } from './tools'

/**
 * Presentation component for the drawing toolbar.
 *
 * @return {React.Element} the rendered component
 */
const DrawingToolbarPresentation = ({ onToolSelected, selectedTool, theme }) => {
  const selectedColor = theme.palette.primary[500]
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
  onToolSelected: PropTypes.func,
  selectedTool: PropTypes.string,
  theme: PropTypes.object.isRequired
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
  withTheme()(DrawingToolbarPresentation)
)

export default DrawingToolbar

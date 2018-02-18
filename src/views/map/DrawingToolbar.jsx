import PropTypes from 'prop-types'
import React from 'react'

import IconButton from 'material-ui/IconButton'
import withTheme from 'material-ui/styles/withTheme'
import LocationOn from 'material-ui-icons/LocationOn'
import ShowChart from 'material-ui-icons/ShowChart'
import CropSquare from 'material-ui-icons/CropSquare'
import PanoramaFishEye from 'material-ui-icons/PanoramaFishEye'
import LabelOutline from 'material-ui-icons/LabelOutline'

import partial from 'lodash/partial'
import { connect } from 'react-redux'

import { selectMapTool } from '../../actions/map'
import EditFeature from '../../icons/EditFeature'
import { Tool } from './tools'

/**
 * Presentation component for the drawing toolbar.
 *
 * @return {React.Element} the rendered component
 */
const DrawingToolbarPresentation = ({ onToolSelected, selectedTool, theme }) => {
  const colorForTool = (tool) => (
    selectedTool === tool ? 'primary' : undefined
  )

  return (
    <div style={{ display: 'flex', flexFlow: 'column nowrap' }}>
      <IconButton onClick={partial(onToolSelected, Tool.DRAW_POINT)} tooltip='Add marker'>
        <LocationOn color={colorForTool(Tool.DRAW_POINT)} />
      </IconButton>
      <IconButton onClick={partial(onToolSelected, Tool.DRAW_PATH)} tooltip='Draw path'>
        <ShowChart color={colorForTool(Tool.DRAW_PATH)} />
      </IconButton>
      <IconButton onClick={partial(onToolSelected, Tool.DRAW_CIRCLE)} tooltip='Draw circle'>
        <PanoramaFishEye color={colorForTool(Tool.DRAW_CIRCLE)} />
      </IconButton>
      <IconButton onClick={partial(onToolSelected, Tool.DRAW_RECTANGLE)} tooltip='Draw rectangle'>
        <CropSquare color={colorForTool(Tool.DRAW_RECTANGLE)} />
      </IconButton>
      <IconButton onClick={partial(onToolSelected, Tool.DRAW_POLYGON)} tooltip='Draw polygon'>
        <LabelOutline color={colorForTool(Tool.DRAW_POLYGON)} />
      </IconButton>
      <IconButton onClick={partial(onToolSelected, Tool.EDIT_FEATURE)} tooltip='Edit feature'>
        <EditFeature color={colorForTool(Tool.EDIT_FEATURE)} />
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

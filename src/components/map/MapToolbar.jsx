import React, { PropTypes } from 'react'

import IconButton from 'material-ui/IconButton'
import ActionPanTool from 'material-ui/svg-icons/action/pan-tool'
import ActionZoomIn from 'material-ui/svg-icons/action/zoom-in'
import ContentSelectAll from 'material-ui/svg-icons/content/select-all'

import LayersDialog from './LayersDialog'
import MapRotationTextBox from './MapRotationTextBox'
import FitAllFeaturesButton from './FitAllFeaturesButton'

import partial from 'lodash/partial'
import { connect } from 'react-redux'

import Signal from 'mini-signals'

import { selectMapTool } from '../../actions/map'
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
    }}></div>
  )
}

/**
 * Presentation component for the map toolbar.
 *
 * @returns {Object} the rendered component
 */
class MapToolbarPresentation extends React.Component {
  getChildContext () {
    return {mapReferenceRequestSignal: this.props.mapReferenceRequestSignal}
  }

  render () {
    const { selectedTool, onToolSelected } = this.props
    const { muiTheme } = this.context

    const selectedColor = muiTheme.palette.primary1Color
    const colorForTool = (tool) => (
      selectedTool === tool ? selectedColor : undefined
    )

    return (
      <div>
        <IconButton onClick={partial(onToolSelected, Tool.SELECT)} tooltip="Select">
          <ContentSelectAll color={colorForTool(Tool.SELECT)} />
        </IconButton>
        <IconButton onClick={partial(onToolSelected, Tool.ZOOM)} tooltip="Zoom">
          <ActionZoomIn color={colorForTool(Tool.ZOOM)} />
        </IconButton>
        <IconButton onClick={partial(onToolSelected, Tool.PAN)} tooltip="Pan">
          <ActionPanTool color={colorForTool(Tool.PAN)} />
        </IconButton>

        <MapToolbarSeparator />

        <LayersDialog />

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
  onSourceSelected: PropTypes.func,
  onToolSelected: PropTypes.func,
  mapReferenceRequestSignal: PropTypes.instanceOf(Signal)
}

MapToolbarPresentation.contextTypes = {
  muiTheme: PropTypes.object
}

MapToolbarPresentation.childContextTypes = {
  mapReferenceRequestSignal: PropTypes.instanceOf(Signal)
}

/**
 * Main toolbar on the map.
 */
const MapToolbar = connect(
  // mapStateToProps
  state => Object.assign({}, state.map.tools),
  // mapDispatchToProps
  dispatch => ({
    onToolSelected (tool) {
      dispatch(selectMapTool(tool))
    }
  })
)(MapToolbarPresentation)

export default MapToolbar

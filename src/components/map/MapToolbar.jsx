import React, { PropTypes } from 'react'

import IconButton from 'material-ui/IconButton'
import ActionPanTool from 'material-ui/svg-icons/action/pan-tool'
import ActionZoomIn from 'material-ui/svg-icons/action/zoom-in'
import ContentSelectAll from 'material-ui/svg-icons/content/select-all'

import IconMenu from 'material-ui/IconMenu'
import MenuItem from 'material-ui/MenuItem'
import MapsLayers from 'material-ui/svg-icons/maps/layers'
import MapRotationTextBox from './MapRotationTextBox'
import FitAllFeaturesButton from './FitAllFeaturesButton'

import partial from 'lodash/partial'
import { connect } from 'react-redux'

import Signal from 'mini-signals'

import { selectMapTool, selectMapSource } from '../../actions/map'
import { Tool } from './tools'
import { Source } from './sources'

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
const MapToolbarPresentation = (
  { visibleSource, onSourceSelected, selectedTool, onToolSelected, mapReferenceRequestSignal },
  { muiTheme }
) => {
  const selectedColor = muiTheme.palette.primary1Color
  const colorForTool = (tool) => (
    selectedTool === tool ? selectedColor : undefined
  )
  const handleSourceChange = (event, value) => {
    onSourceSelected(value)
  }

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

      <IconMenu
          iconButtonElement={
            <IconButton tooltip="Select layer"><MapsLayers /></IconButton>
          }
          onChange={handleSourceChange}
          value={visibleSource}
          selectedMenuItemStyle={{ color: selectedColor }}
          targetOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          useLayerForClickAway={true}
        >
        <MenuItem value={Source.OSM} primaryText="OpenStreetMap" />
        <MenuItem value={Source.BING_MAPS.AERIAL_WITH_LABELS}
          primaryText="Bing Maps (aerial with labels)" />
        <MenuItem value={Source.BING_MAPS.ROAD} primaryText="Bing Maps (road)" />
      </IconMenu>

      <MapToolbarSeparator />

      <MapRotationTextBox resetDuration={500} fieldWidth={'75px'}
        style={{
          display: 'inline-block',
          marginRight: '12px',
          verticalAlign: 'top'
        }}
        mapReferenceRequestSignal={mapReferenceRequestSignal} />

      <MapToolbarSeparator />

      <FitAllFeaturesButton duration={500} margin={64}
        mapReferenceRequestSignal={mapReferenceRequestSignal} />
    </div>
  )
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

/**
 * Main toolbar on the map.
 */
const MapToolbar = connect(
  // mapStateToProps
  state => Object.assign({}, state.map.tools,
    {
      visibleSource: state.map.layers.visibleSource
    }
  ),
  // mapDispatchToProps
  dispatch => ({
    onSourceSelected (source) {
      dispatch(selectMapSource(source))
    },
    onToolSelected (tool) {
      dispatch(selectMapTool(tool))
    }
  })
)(MapToolbarPresentation)

export default MapToolbar

import React, { PropTypes } from 'react'

import IconButton from 'material-ui/IconButton'
import ActionPanTool from 'material-ui/svg-icons/action/pan-tool'
import ActionZoomIn from 'material-ui/svg-icons/action/zoom-in'
import ContentSelectAll from 'material-ui/svg-icons/content/select-all'

import IconMenu from 'material-ui/IconMenu'
import MenuItem from 'material-ui/MenuItem'
import MapsLayers from 'material-ui/svg-icons/maps/layers'
import MapRotationTextBox from './MapRotationTextBox'

import partial from 'lodash/partial'
import { connect } from 'react-redux'

import { selectMapTool, selectMapSource } from '../../actions/map'
import { Tool } from './tools'
import { Source } from './sources'

/**
 * Presentation component for the map toolbar.
 *
 * @returns {Object} the rendered component
 */
const MapToolbarPresentation = ({ visibleSource, onSourceSelected, selectedTool, onToolSelected, mapReferenceSignals }, { muiTheme }) => {
  const selectedColor = muiTheme.palette.primary1Color
  const colorForTool = (tool) => (
    selectedTool === tool ? selectedColor : undefined
  )
  const handleSourceChange = (event, value) => {
    onSourceSelected(value)
  }

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
      <IconMenu
          iconButtonElement={<IconButton><MapsLayers /></IconButton>}
          onChange={handleSourceChange}
          value={visibleSource}
          selectedMenuItemStyle={{ color: selectedColor }}
          style={{ borderLeft: '1px solid rgba(0, 0, 0,  0.172549)' }}
          targetOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          useLayerForClickAway={true}
        >
        <MenuItem value={Source.OSM} primaryText="OpenStreetMap" />
        <MenuItem value={Source.BING_MAPS.AERIAL_WITH_LABELS} primaryText="Bing Maps (aerial with labels)" />
        <MenuItem value={Source.BING_MAPS.ROAD} primaryText="Bing Maps (road)" />
      </IconMenu>
      <MapRotationTextBox fieldWidth={'75px'}
        style={{
          display: 'inline-block',
          marginRight: '12px',
          borderLeft: '1px solid rgba(0, 0, 0,  0.172549)',
          verticalAlign: 'top'
        }}
        mapReferenceSignals={mapReferenceSignals} />
    </div>
  )
}

MapToolbarPresentation.propTypes = {
  visibleSource: PropTypes.string,
  selectedTool: PropTypes.string,
  onSourceSelected: PropTypes.func,
  onToolSelected: PropTypes.func,
  mapReferenceSignals: PropTypes.object
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
    {visibleSource: state.map.sources.visibleSource}),
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

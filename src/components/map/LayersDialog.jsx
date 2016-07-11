/**
* @file React Component for the layer settings dialog.
*/

import partial from 'lodash/partial'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import { List, ListItem } from 'material-ui/List'
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'
import Toggle from 'material-ui/Toggle'

import ActionAspectRatio from 'material-ui/svg-icons/action/aspect-ratio'
import ActionTrackChanges from 'material-ui/svg-icons/action/track-changes'
import DeviceAirplanemodeActive from 'material-ui/svg-icons/device/airplanemode-active'
import FileAttachment from 'material-ui/svg-icons/file/attachment'

import { Source } from './sources'
import { closeLayersDialog, setSelectedLayerInLayersDialog } from '../../actions/layers'
import { selectMapSource } from '../../actions/map'

const LayerSettingsContainer = ({visible, title, children}) => (
  <div style={{display: visible ? 'block' : 'none'}}>
    {children}
  </div>
)

LayerSettingsContainer.propTypes = {
  visible: PropTypes.bool,
  title: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
}

function iconForLayerType (layerType) {
  switch (layerType) {
    case 'base':
      return <ActionAspectRatio />

    case 'geojson':
      return <FileAttachment />

    case 'heatmap':
      return <ActionTrackChanges />

    case 'uavs':
      return <DeviceAirplanemodeActive />

    default:
      return null
  }
}

function labelForLayerType (layerType) {
  return {
    base: 'Base layer',
    geojson: 'GeoJSON',
    heatmap: 'Heatmap',
    location: 'Own location',
    uavs: 'UAVs'
  }[layerType]
}

/**
 * Presentation component for the dialog that shows the configuration of
 * layers in the map.
 */
class LayersDialogPresentation extends React.Component {
  constructor (props) {
    super(props)
    this.handleSourceChange_ = this.handleSourceChange_.bind(this)
  }

  render () {
    const { dialogVisible, selectedLayer } = this.props
    const { onLayerSelected, onClose } = this.props
    const getListItemStyle = layer => (
      selectedLayer === layer ? 'selected-list-item' : undefined
    )
    const getVisibility = layer => (
      selectedLayer === layer
    )
    const actions = [
      <FlatButton label="Done" primary={true} onTouchTap={onClose} />
    ]

    const listItems = []
    for (let layerId in this.props.layers) {
      const layer = this.props.layers[layerId]
      listItems.push(
        <ListItem
          key={layerId}
          primaryText={layer.label}
          secondaryText={labelForLayerType(layer.type)}
          leftIcon={iconForLayerType(layer.type)}
          className={getListItemStyle(layerId)}
          onTouchTap={partial(onLayerSelected, layerId)} />
      )
    }

    return (
      <Dialog
        title="Layers"
        open={dialogVisible}
        actions={actions}
        bodyStyle={{display: 'flex', overflow: 'visible'}}
        onRequestClose={onClose}
        >
        <div style={{ flex: '3' }}>
          <List className="dialog-sidebar">
            {listItems}
          </List>
        </div>
        <div style={{flex: '7', marginLeft: '5px', padding: '15px'}}>
          <LayerSettingsContainer
            visible={getVisibility('base')}
            title="Base map layer selection">
            <RadioButtonGroup name="source.base"
              valueSelected={this.props.visibleSource}
              onChange={this.handleSourceChange_}>
              <RadioButton
                value={Source.OSM}
                label="OpenStreetMap" />
              <RadioButton
                value={Source.BING_MAPS.AERIAL_WITH_LABELS}
                label="Bing Maps (aerial with labels)" />
              <RadioButton
                value={Source.BING_MAPS.ROAD}
                label="Bing Maps (road)" />
            </RadioButtonGroup>
          </LayerSettingsContainer>
          <LayerSettingsContainer
            visible={getVisibility('uav')}
            title="UAV Display Settings">
          </LayerSettingsContainer>
          <LayerSettingsContainer
            visible={getVisibility('geojson')}
            title="GeoJSON Import">
          </LayerSettingsContainer>
          <LayerSettingsContainer
            visible={getVisibility('heatmap')}
            title="Heatmap">
            <Toggle label="Active" disabled={true} />
          </LayerSettingsContainer>
        </div>
      </Dialog>
    )
  }

  /**
  * Handler for changing the base map source.
  *
  * @param {Event} event the event fired from the RadioButtonGroup component
  * @param {string} value string representation of the selected source
  */
  handleSourceChange_ (event, value) {
    this.props.onSourceSelected(value)
  }
}

LayersDialogPresentation.propTypes = {
  dialogVisible: PropTypes.bool.isRequired,
  layers: PropTypes.object.isRequired,
  selectedLayer: PropTypes.string,
  visibleSource: PropTypes.string,

  onClose: PropTypes.func,
  onLayerSelected: PropTypes.func,
  onSourceSelected: PropTypes.func
}

LayersDialogPresentation.defaultProps = {
  dialogVisible: false,
  layers: {}
}

/**
 * Container of the dialog that allows the user to configure the layers of
 * the map.
 */
const LayersDialog = connect(
  // mapStateToProps
  state => ({
    dialogVisible: state.dialogs.layerSettings.dialogVisible,
    layers: state.map.layers.byId,
    selectedLayer: state.dialogs.layerSettings.selectedLayer,
    visibleSource: state.map.layers.byId.base.parameters.source
  }),
  // mapDispatchToProps
  dispatch => ({
    onClose () {
      dispatch(closeLayersDialog())
    },
    onLayerSelected (layerId) {
      dispatch(setSelectedLayerInLayersDialog(layerId))
    },
    onSourceSelected (source) {
      dispatch(selectMapSource(source))
    }
  })
)(LayersDialogPresentation)

export default LayersDialog

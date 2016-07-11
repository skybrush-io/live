/**
* @file React Component for the layer settings dialog.
*/

import partial from 'lodash/partial'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import IconButton from 'material-ui/IconButton'
import { List, ListItem } from 'material-ui/List'
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'
import Toggle from 'material-ui/Toggle'

import ActionAspectRatio from 'material-ui/svg-icons/action/aspect-ratio'
import ActionTrackChanges from 'material-ui/svg-icons/action/track-changes'
import DeviceAirplanemodeActive from 'material-ui/svg-icons/device/airplanemode-active'
import FileAttachment from 'material-ui/svg-icons/file/attachment'
import MapsLayers from 'material-ui/svg-icons/maps/layers'

import { Source } from './sources'
import { closeLayersDialog, showLayersDialog,
  setSelectedLayerInLayersDialog } from '../../actions/layers'
import { selectMapSource } from '../../actions/map'

import GeoJSONImporter from './GeoJSONImporter'

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
    const { onLayerSelected, onShow, onClose } = this.props
    const getListItemStyle = layer => (
      selectedLayer === layer ? 'selected-list-item' : undefined
    )
    const getVisibility = layer => (
      selectedLayer === layer
    )

    const actions = [
      <FlatButton label="Done" primary={true} onTouchTap={onClose} />
    ]

    return (
      <div style={{display: 'inline-block'}}>
        <IconButton onClick={onShow} tooltip="Layers">
          <MapsLayers />
        </IconButton>
        <Dialog
          title="Layers"
          open={dialogVisible}
          actions={actions}
          bodyStyle={{display: 'flex', overflow: 'visible'}}
          onRequestClose={onClose}
          >
          <div style={{ flex: '2' }}>
            <List className="dialog-sidebar">
              <ListItem
                primaryText="Base map"
                secondaryText="Base layer"
                leftIcon={<ActionAspectRatio />}
                className={getListItemStyle('base')}
                onTouchTap={partial(onLayerSelected, 'base')} />
              <ListItem
                primaryText="UAVs"
                secondaryText="Active UAVs"
                leftIcon={<DeviceAirplanemodeActive />}
                className={getListItemStyle('uav')}
                onTouchTap={partial(onLayerSelected, 'uav')} />
              <ListItem
                primaryText="Geofence"
                secondaryText="GeoJSON layer"
                leftIcon={<FileAttachment />}
                className={getListItemStyle('geojson')}
                onTouchTap={partial(onLayerSelected, 'geojson')} />
              <ListItem
                primaryText="Radiation"
                secondaryText="Heatmap"
                leftIcon={<ActionTrackChanges />}
                className={getListItemStyle('heatmap')}
                onTouchTap={partial(onLayerSelected, 'heatmap')} />
            </List>
          </div>
          <div style={{flex: '8', marginLeft: '5px', padding: '15px'}}>
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
              <GeoJSONImporter />
            </LayerSettingsContainer>
            <LayerSettingsContainer
              visible={getVisibility('heatmap')}
              title="Heatmap">
              <Toggle label="Active" disabled={true} />
            </LayerSettingsContainer>
          </div>
        </Dialog>
      </div>
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
  selectedLayer: PropTypes.string,
  visibleSource: PropTypes.string,

  onClose: PropTypes.func,
  onLayerSelected: PropTypes.func,
  onShow: PropTypes.func,
  onSourceSelected: PropTypes.func
}

LayersDialogPresentation.defaultProps = {
  dialogVisible: false
}

/**
 * Container of the dialog that allows the user to configure the layers of
 * the map.
 */
const LayersDialog = connect(
  // mapStateToProps
  state => ({
    dialogVisible: state.dialogs.layerSettings.dialogVisible,
    selectedLayer: state.dialogs.layerSettings.selectedLayer,
    visibleSource: state.map.layers.byId.base.parameters.source
  }),
  // mapDispatchToProps
  dispatch => ({
    onClose () {
      dispatch(closeLayersDialog())
    },
    onShow () {
      dispatch(showLayersDialog())
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

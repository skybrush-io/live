/**
* @file React Component for the layer settings dialog.
*/

import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import IconButton from 'material-ui/IconButton'
import MapsLayers from 'material-ui/svg-icons/maps/layers'

import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'

import { List, ListItem } from 'material-ui/List'
import ActionAspectRatio from 'material-ui/svg-icons/action/aspect-ratio'
import DeviceAirplanemodeActive from 'material-ui/svg-icons/device/airplanemode-active'
import FileAttachment from 'material-ui/svg-icons/file/attachment'

import Paper from 'material-ui/Paper'
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'
import { Source } from './sources'
import { selectMapSource } from '../../actions/map'

export default class LayersDialog extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      dialogVisible: false,
      selectedLayer: 'base'
    }

    this.showDialog_ = this.showDialog_.bind(this)
    this.hideDialog_ = this.hideDialog_.bind(this)

    this.handleSourceChange_ = this.handleSourceChange_.bind(this)
  }

  render () {
    const selectedColor = this.context.muiTheme.palette.primary1Color
    const actions = [
      <FlatButton label="Done" primary={true} onTouchTap={this.hideDialog_} />
    ]
    return (
      <div style={{display: 'inline-block'}}>
        <IconButton onClick={this.showDialog_} tooltip="Layers">
          <MapsLayers />
        </IconButton>
        <Dialog
          title="Layers"
          open={this.state.dialogVisible}
          actions={actions}
          bodyStyle={{display: 'flex', overflow: 'visible'}}
          >
          <Paper>
            <List style={{flex: '2'}}>
              <ListItem
                primaryText="Base"
                leftIcon={<ActionAspectRatio />}
                style={this.state.selectedLayer === 'base' ? {color: selectedColor} : {}}/>
              <ListItem
                primaryText="UAVs"
                leftIcon={<DeviceAirplanemodeActive />}
                style={this.state.selectedLayer === 'uav' ? {color: selectedColor} : {}}/>
              <ListItem
                primaryText="GeoJSON"
                leftIcon={<FileAttachment />}
                style={this.state.selectedLayer === 'geojson' ? {color: selectedColor} : {}}/>
            </List>
          </Paper>
          <Paper style={{flex: '8', marginLeft: '5px', padding: '10px'}}>
            <div>
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
            </div>
          </Paper>
        </Dialog>
      </div>
    )
  }

  /**
   * Function for showing the dialog.
   */
  showDialog_ () { this.setState({dialogVisible: true}) }

  /**
   * Function for hiding the dialog.
   */
  hideDialog_ () { this.setState({dialogVisible: false}) }

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

LayersDialog.propTypes = {
  visibleSource: PropTypes.string,
  onSourceSelected: PropTypes.func
}

LayersDialog.contextTypes = {
  muiTheme: PropTypes.object
}

export default connect(
  // mapStateToProps
  state => Object.assign({},
    {
      visibleSource: state.map.layers.byId.base.parameters.source
    }
  ),
  // mapDispatchToProps
  dispatch => ({
    onSourceSelected (source) {
      dispatch(selectMapSource(source))
    }
  })
)(LayersDialog)

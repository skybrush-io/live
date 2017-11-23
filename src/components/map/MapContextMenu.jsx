/**
 * @file Context menu using a Popover element that displays connands to send to the
 * currently selected UAVs.
 */

import { autobind } from 'core-decorators'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import Divider from 'material-ui/Divider'
import { MenuItem } from 'material-ui/Menu'
import ActionDelete from 'material-ui-icons/Delete'
import ActionFlightTakeoff from 'material-ui-icons/FlightTakeoff'
import ActionFlightLand from 'material-ui-icons/FlightLand'
import ActionHome from 'material-ui-icons/Home'
import ActionPowerSettingsNew from 'material-ui-icons/PowerSettingsNew'
import ImageEdit from 'material-ui-icons/Edit'
import Message from 'material-ui-icons/Message'

import ContextMenu from '../ContextMenu'

import { renameFeature, removeFeatures } from '../../actions/features'
import { selectUAVInMessagesDialog, showMessagesDialog } from '../../actions/messages'
import { getSelectedFeatureIds, getSelectedUAVIds } from '../../selectors'
import * as messaging from '../../utils/messaging'

/**
 * Context menu that shows the menu items that should appear when the
 * user right-clicks on the map.
 */
class MapContextMenu extends React.Component {
  constructor (props) {
    super(props)

    this._assignContextMenuRef = (value) => { this._contextMenu = value }
  }

  /**
   * Public method to open the context menu.
   *
   * @param {Object} position Coordinates where the absolutely positioned popup
   * should appear.
   * @property {number} x The value to forward as `left` into the style object.
   * @property {number} y The value to forward as `top` into the style object.
   */
  @autobind
  open (position) {
    if (this._contextMenu) {
      this._contextMenu.open(position)
    }
  }

  render () {
    const { selectedFeatureIds, selectedUAVIds } = this.props
    return (
      <ContextMenu ref={this._assignContextMenuRef}>
        <MenuItem dense disabled={selectedUAVIds.length === 0}
          onClick={this._takeoffSelectedUAVs}>
          <ActionFlightTakeoff /> Takeoff
        </MenuItem>
        <MenuItem dense disabled={selectedUAVIds.length === 0}
          onClick={this._landSelectedUAVs}>
          <ActionFlightLand /> Land
        </MenuItem>
        <MenuItem dense disabled={selectedUAVIds.length === 0}
          onClick={this._returnSelectedUAVs}>
          <ActionHome /> Return to home
        </MenuItem>
        <MenuItem dense disabled={selectedUAVIds.length !== 1}
          onClick={this._showMessagesDialog}>
          <Message /> Messages
        </MenuItem>
        <MenuItem dense disabled={selectedUAVIds.length === 0}
          onClick={this._shutdownSelectedUAVs}>
          <ActionPowerSettingsNew color='red' /> Halt
        </MenuItem>
        <Divider />
        <MenuItem dense disabled={selectedFeatureIds.length !== 1}
          onClick={this._renameSelectedFeatures}>
          <ImageEdit /> Rename...
        </MenuItem>
        <MenuItem dense disabled={selectedFeatureIds.length === 0}
          onClick={this._removeSelectedFeatures}>
          <ActionDelete /> Remove
        </MenuItem>
      </ContextMenu>
    )
  }

  @autobind
  _takeoffSelectedUAVs () {
    messaging.takeoffUAVs(this.props.selectedUAVIds)
  }

  @autobind
  _landSelectedUAVs () {
    messaging.landUAVs(this.props.selectedUAVIds)
  }

  @autobind
  _renameSelectedFeatures () {
    const { selectedFeatureIds } = this.props
    if (selectedFeatureIds.length !== 1) {
      return
    }

    const id = selectedFeatureIds[0]
    // TODO: do this with a proper Material-UI dialog, not a browser prompt
    const label = window.prompt(
      'Enter the new label of the feature'
    )
    if (label !== null) {
      this.props.renameFeature(id, label)
    }
  }

  @autobind
  _removeSelectedFeatures () {
    this.props.removeFeaturesByIds(this.props.selectedFeatureIds)
  }

  @autobind
  _returnSelectedUAVs () {
    messaging.returnToHomeUAVs(this.props.selectedUAVIds)
  }

  @autobind
  _shutdownSelectedUAVs () {
    messaging.shutdownUAVs(this.props.selectedUAVIds)
  }

  @autobind
  _showMessagesDialog () {
    if (this.props.selectedUAVIds.length === 1) {
      this.props.selectUAVInMessagesDialog(this.props.selectedUAVIds[0])
    }

    this.props.showMessagesDialog()
  }
}

MapContextMenu.propTypes = {
  renameFeature: PropTypes.func.isRequired,
  removeFeaturesByIds: PropTypes.func.isRequired,
  selectedFeatureIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedUAVIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectUAVInMessagesDialog: PropTypes.func.isRequired,
  showMessagesDialog: PropTypes.func.isRequired
}

const MapContextMenuContainer = connect(
  // mapStateToProps
  state => ({
    selectedFeatureIds: getSelectedFeatureIds(state),
    selectedUAVIds: getSelectedUAVIds(state)
  }),
  // mapDispatchToProps
  dispatch => ({
    removeFeaturesByIds: (ids) => {
      dispatch(removeFeatures(ids))
    },
    renameFeature: (id, label) => {
      dispatch(renameFeature(id, label))
    },
    selectUAVInMessagesDialog: (id) => {
      dispatch(selectUAVInMessagesDialog(id))
    },
    showMessagesDialog: () => {
      dispatch(showMessagesDialog())
    }
  }),
  null,
  { withRef: true }
)(MapContextMenu)

export default MapContextMenuContainer

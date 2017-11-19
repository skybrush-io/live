/**
 * @file Context menu using a Popover element that displays connands to send to the
 * currently selected UAVs.
 */

import { autobind } from 'core-decorators'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import { Divider, MenuItem } from 'material-ui'
import ActionDelete from 'material-ui/svg-icons/action/delete'
import ActionFlightTakeoff from 'material-ui/svg-icons/action/flight-takeoff'
import ActionFlightLand from 'material-ui/svg-icons/action/flight-land'
import ActionHome from 'material-ui/svg-icons/action/home'
import ActionPowerSettingsNew from 'material-ui/svg-icons/action/power-settings-new'
import Message from 'material-ui/svg-icons/communication/message'

import ContextMenu from '../ContextMenu'

import { removeFeatures } from '../../actions/features'
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
        <MenuItem disabled={selectedUAVIds.length === 0}
          onClick={this._takeoffSelectedUAVs}
          primaryText='Takeoff'
          leftIcon={<ActionFlightTakeoff />}
        />
        <MenuItem disabled={selectedUAVIds.length === 0}
          onClick={this._landSelectedUAVs}
          primaryText='Land'
          leftIcon={<ActionFlightLand />}
        />
        <MenuItem disabled={selectedUAVIds.length === 0}
          onClick={this._returnSelectedUAVs}
          primaryText='Return to home'
          leftIcon={<ActionHome />}
        />
        <MenuItem disabled={selectedUAVIds.length !== 1}
          onClick={this._showMessagesDialog}
          primaryText='Messages'
          leftIcon={<Message />}
        />
        <MenuItem disabled={selectedUAVIds.length === 0}
          onClick={this._shutdownSelectedUAVs}
          primaryText='Halt'
          leftIcon={<ActionPowerSettingsNew color='red' />}
        />
        <Divider />
        <MenuItem disabled={selectedFeatureIds.length === 0}
          onClick={this._removeSelectedFeatures}
          primaryText='Remove'
          leftIcon={<ActionDelete />}
        />
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

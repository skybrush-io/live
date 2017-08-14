/**
 * @file Context menu using a Popover element that displays connands to send to the
 * currently selected UAVs.
 */

import React from 'react'
import { connect } from 'react-redux'

import Popover from 'material-ui/Popover'
import Menu from 'material-ui/Menu'
import MenuItem from 'material-ui/MenuItem'

import ActionFlightTakeoff from 'material-ui/svg-icons/action/flight-takeoff'
import ActionFlightLand from 'material-ui/svg-icons/action/flight-land'
import ActionHome from 'material-ui/svg-icons/action/home'
import ActionPowerSettingsNew from 'material-ui/svg-icons/action/power-settings-new'
import Message from 'material-ui/svg-icons/communication/message'

import { selectUAVInMessagesDialog, showMessagesDialog } from '../../actions/messages'
import messageHub from '../../message-hub'

/**
 * Context menu using a Popover element that displays connands to send to the
 * currently selected UAVs.
 */
class ContextMenuPopup extends React.Component {
  constructor (props) {
    super(props)

    this._handleRequestClose = this._handleRequestClose.bind(this)
    this._preventDefault = this._preventDefault.bind(this)

    this._takeoffSelectedUAVs = this._takeoffSelectedUAVs.bind(this)
    this._landSelectedUAVs = this._landSelectedUAVs.bind(this)
    this._returnSelectedUAVs = this._returnSelectedUAVs.bind(this)

    this._showMessagesDialog = this._showMessagesDialog.bind(this)

    this.state = {
      open: false,
      opening: false,
      position: {
        x: 100,
        y: 200
      }
    }
  }

  /**
   * Public method to open the context menu.
   *
   * @param {Object} position Coordinates where the absolutely positioned popup
   * should appear.
   * @property {number} x The value to forward as `left` into the style object.
   * @property {number} y The value to forward as `top` into the style object.
   */
  open (position) {
    this.setState({ opening: true, open: true, position })

    this.refs.popover.refs.layer.layer.addEventListener(
      'contextmenu',
      this._preventDefault
    )
  }

  /**
   * Private method to request the closing of the context menu when the user
   * selects a menu item or clicks away.
   */
  _handleRequestClose () {
    this.refs.popover.refs.layer.layer.removeEventListener(
      'contextmenu',
      this._preventDefault
    )

    this.setState({
      open: false
    })
  }

  /**
   * Right click handler to prevent the default context menu of the browser
   * while the menu is opening and close it if the event happens when it's
   * already open.
   *
   * @param {MouseEvent} e The event being fired.
   */
  _preventDefault (e) {
    if (this.state.opening) {
      this.setState({ opening: false })
    } else {
      this._handleRequestClose()
    }

    e.preventDefault()
  }

  render () {
    const { selectedUAVIds } = this.props

    return (
      <div>
        <div style={{
          position: 'absolute',
          top: `${this.state.position.y}px`,
          left: `${this.state.position.x}px`
        }} ref={'anchor'} />

        <Popover ref={'popover'}
          open={this.state.open}
          anchorEl={this.refs.anchor}
          anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
          targetOrigin={{horizontal: 'left', vertical: 'top'}}
          onRequestClose={this._handleRequestClose}
        >
          <Menu>
            <MenuItem disabled={selectedUAVIds.length === 0}
              onClick={this._takeoffSelectedUAVs}
              primaryText={'Takeoff'}
              leftIcon={<ActionFlightTakeoff />}
            />
            <MenuItem disabled={selectedUAVIds.length === 0}
              onClick={this._landSelectedUAVs}
              primaryText={'Land'}
              leftIcon={<ActionFlightLand />}
            />
            <MenuItem disabled={selectedUAVIds.length === 0}
              onClick={this._returnSelectedUAVs}
              primaryText={'Return to home'}
              leftIcon={<ActionHome />}
            />
            <MenuItem disabled={selectedUAVIds.length !== 1}
              onClick={this._showMessagesDialog}
              primaryText={'Messages'}
              leftIcon={<Message />}
            />
            <MenuItem disabled={selectedUAVIds.length === 0}
              primaryText={'Halt'}
              leftIcon={<ActionPowerSettingsNew color={'red'} />}
            />
          </Menu>
        </Popover>
      </div>
    )
  }

  _takeoffSelectedUAVs () {
    messageHub.sendMessage({
      type: 'UAV-TAKEOFF',
      ids: this.props.selectedUAVIds
    }).then(result => console.log(result))

    this._handleRequestClose()
  }

  _landSelectedUAVs () {
    messageHub.sendMessage({
      type: 'UAV-LAND',
      ids: this.props.selectedUAVIds
    }).then(result => console.log(result))

    this._handleRequestClose()
  }

  _returnSelectedUAVs () {
    messageHub.sendMessage({
      type: 'UAV-RTH',
      ids: this.props.selectedUAVIds
    }).then(result => console.log(result))

    this._handleRequestClose()
  }

  _showMessagesDialog () {
    if (this.props.selectedUAVIds.length === 1) {
      this.props.selectUAVInMessagesDialog(this.props.selectedUAVIds[0])
    }

    this._handleRequestClose()

    this.props.showMessagesDialog()
  }
}

export default connect(
  // mapStateToProps
  state => ({
    selectedUAVIds: state.map.selection
  }),
  // mapDispatchToProps
  dispatch => ({
    selectUAVInMessagesDialog: (id) => {
      dispatch(selectUAVInMessagesDialog(id))
    },
    showMessagesDialog: () => {
      dispatch(showMessagesDialog())
    }
  }),
  null,
  { withRef: true }
)(ContextMenuPopup)

/**
 * @file Context menu using a Popover element that displays connands to send to the
 * currently selected UAVs.
 */

import { autobind } from 'core-decorators'
import PropTypes from 'prop-types'
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
import { getSelectedUAVIds } from '../../selectors'
import * as messaging from '../../utils/messaging'

/**
 * Context menu using a Popover element that displays connands to send to the
 * currently selected UAVs.
 */
class ContextMenuPopup extends React.Component {
  constructor (props) {
    super(props)

    this._assignAnchorRef = (value) => { this.setState({ anchor: value }) }

    this.state = {
      open: false,
      opening: false,
      position: {
        x: 0,
        y: 0
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
    // Prevent the document body from firing a contextmenu event
    document.body.addEventListener(
      'contextmenu', this._preventDefault
    )

    // Start opening the context menu
    this.setState({
      opening: true,
      open: false,
      position
    })
  }

  /**
   * Private method to request the closing of the context menu when the user
   * selects a menu item or clicks away.
   */
  @autobind
  _handleRequestClose () {
    document.body.removeEventListener(
      'contextmenu', this._preventDefault
    )

    this.setState({
      open: false, opening: false
    })
  }

  /**
   * Right click handler to prevent the default context menu of the browser
   * while the menu is opening and close it if the event happens when it's
   * already open.
   *
   * @param {MouseEvent} e The event being fired.
   */
  @autobind
  _preventDefault (e) {
    if (this.state.opening) {
      this.setState({ opening: false, open: true })
    } else {
      this._handleRequestClose()
    }

    e.preventDefault()
  }

  render () {
    const { selectedUAVIds } = this.props
    const { position } = this.state

    const anchor = (
      <div style={{ position: 'absolute', left: position.x, top: position.y }}
        ref={this._assignAnchorRef} />
    )

    return (
      <div>
        { anchor }
        <Popover
          open={this.state.open || this.state.opening}
          anchorEl={this.state.anchor}
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
              onClick={this._shutdownSelectedUAVs}
              primaryText={'Halt'}
              leftIcon={<ActionPowerSettingsNew color={'red'} />}
            />
          </Menu>
        </Popover>
      </div>
    )
  }

  @autobind
  _takeoffSelectedUAVs () {
    messaging.takeoffUAVs(this.props.selectedUAVIds)
    this._handleRequestClose()
  }

  @autobind
  _landSelectedUAVs () {
    messaging.landUAVs(this.props.selectedUAVIds)
    this._handleRequestClose()
  }

  @autobind
  _returnSelectedUAVs () {
    messaging.returnToHomeUAVs(this.props.selectedUAVIds)
    this._handleRequestClose()
  }

  @autobind
  _shutdownSelectedUAVs () {
    console.log('eee')
    messaging.shutdownUAVs(this.props.selectedUAVIds)
    this._handleRequestClose()
  }

  @autobind
  _showMessagesDialog () {
    if (this.props.selectedUAVIds.length === 1) {
      this.props.selectUAVInMessagesDialog(this.props.selectedUAVIds[0])
    }

    this._handleRequestClose()

    this.props.showMessagesDialog()
  }
}

ContextMenuPopup.propTypes = {
  selectedUAVIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectUAVInMessagesDialog: PropTypes.func.isRequired,
  showMessagesDialog: PropTypes.func.isRequired
}

export default connect(
  // mapStateToProps
  state => ({
    selectedUAVIds: getSelectedUAVIds(state)
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

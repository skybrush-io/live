import { isEmpty } from 'lodash'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import IconButton from 'material-ui/IconButton'
import ActionFlightTakeoff from 'material-ui/svg-icons/action/flight-takeoff'
import ActionFlightLand from 'material-ui/svg-icons/action/flight-land'
import ActionHome from 'material-ui/svg-icons/action/home'
import ActionPowerSettingsNew from 'material-ui/svg-icons/action/power-settings-new'
import Message from 'material-ui/svg-icons/communication/message'

import { selectUAVInMessagesDialog, showMessagesDialog } from '../actions/messages'
import messageHub from '../message-hub'

/**
 * Main toolbar for controlling the UAVs.
 */
class UAVToolbar extends React.Component {
  constructor (props) {
    super(props)

    this.takeoffSelectedUAVs_ = this.takeoffSelectedUAVs_.bind(this)
    this.landSelectedUAVs_ = this.landSelectedUAVs_.bind(this)
    this.returnSelectedUAVs_ = this.returnSelectedUAVs_.bind(this)

    this.showMessagesDialog_ = this.showMessagesDialog_.bind(this)
  }

  render () {
    const isSelectionEmpty = isEmpty(this.props.selection)

    // Don't use material-ui native tooltips here because they won't work
    // nicely for disabled buttons; see https://github.com/callemall/material-ui/issues/3665
    return (
      <div>
        <IconButton disabled={isSelectionEmpty} onClick={this.takeoffSelectedUAVs_}
          tooltipPosition="bottom-right" title="Takeoff">
          <ActionFlightTakeoff />
        </IconButton>
        <IconButton disabled={isSelectionEmpty} onClick={this.landSelectedUAVs_}
          tooltipPosition="bottom-right" title="Land">
          <ActionFlightLand />
        </IconButton>
        <IconButton disabled={isSelectionEmpty} onClick={this.returnSelectedUAVs_}
          tooltipPosition="bottom-right" title="Return to home">
          <ActionHome />
        </IconButton>
        <IconButton onClick={this.showMessagesDialog_}
          tooltipPosition="bottom-right" title="Messages">
          <Message />
        </IconButton>
        <IconButton disabled={isSelectionEmpty}
          tooltipPosition="bottom-right" title="Halt">
          <ActionPowerSettingsNew color="red" />
        </IconButton>
      </div>
    )
  }

  takeoffSelectedUAVs_ () {
    messageHub.sendMessage({
      type: 'UAV-TAKEOFF',
      ids: this.props.selection
    }).then(result => console.log(result))
  }

  landSelectedUAVs_ () {
    messageHub.sendMessage({
      type: 'UAV-LAND',
      ids: this.props.selection
    }).then(result => console.log(result))
  }

  returnSelectedUAVs_ () {
    messageHub.sendMessage({
      type: 'UAV-RTH',
      ids: this.props.selection
    }).then(result => console.log(result))
  }

  showMessagesDialog_ () {
    if (this.props.selection.length === 1) {
      this.props.selectUAVInMessagesDialog(this.props.selection[0])
    }

    this.props.showMessagesDialog()
  }
}

UAVToolbar.propTypes = {
  isSelectionEmpty: PropTypes.bool,
  selectUAVInMessagesDialog: PropTypes.func,
  showMessagesDialog: PropTypes.func,
  selection: PropTypes.arrayOf(PropTypes.string)
}

export default connect(
  // mapStateToProps
  state => ({
    selection: state.map.selection
  }),
  // mapDispatchToProps
  dispatch => ({
    selectUAVInMessagesDialog: (id) => {
      dispatch(selectUAVInMessagesDialog(id))
    },
    showMessagesDialog: () => {
      dispatch(showMessagesDialog())
    }
  })
)(UAVToolbar)

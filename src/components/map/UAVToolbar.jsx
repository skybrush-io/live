import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import IconButton from 'material-ui/IconButton'
import ActionFlightTakeoff from 'material-ui/svg-icons/action/flight-takeoff'
import ActionFlightLand from 'material-ui/svg-icons/action/flight-land'
import ActionHome from 'material-ui/svg-icons/action/home'
import ActionPowerSettingsNew from 'material-ui/svg-icons/action/power-settings-new'
import Message from 'material-ui/svg-icons/communication/message'

import { showMessagesDialog } from '../../actions/messages'
import messageHub from '../../message-hub'
import store from '../../store'

/**
 * Separator component for the toolbar
 *
 * @returns {Object} the rendered component
 */
const UAVToolbarSeparator = () => {
  return (
    <div style={{
      // display: 'inline-block',
      width: '48px',
      borderTop: '1px solid rgba(0, 0, 0,  0.172549)'
    }}></div>
  )
}

/**
 * Main toolbar for controlling the UAVs.
 */
class UAVToolbar extends React.Component {
  constructor (props) {
    super(props)

    this.takeoffSelectedUAVs_ = this.takeoffSelectedUAVs_.bind(this)
    this.landSelectedUAVs_ = this.landSelectedUAVs_.bind(this)
    this.returnSelectedUAVs_ = this.returnSelectedUAVs_.bind(this)
  }

  render () {
    const { isSelectionEmpty } = this.props
    const { onShowMessagesDialog } = this.props
    return (
      <div>
        <IconButton disabled={isSelectionEmpty} onClick={this.takeoffSelectedUAVs_}
          tooltipPosition="bottom-right" tooltip="Takeoff">
          <ActionFlightTakeoff />
        </IconButton>
        <br />
        <IconButton disabled={isSelectionEmpty} onClick={this.landSelectedUAVs_}
          tooltipPosition="bottom-right" tooltip="Land">
          <ActionFlightLand />
        </IconButton>
        <UAVToolbarSeparator />
        <IconButton disabled={isSelectionEmpty} onClick={this.returnSelectedUAVs_}
          tooltipPosition="bottom-right" tooltip="Return">
          <ActionHome />
        </IconButton>
        <UAVToolbarSeparator />
        <IconButton onClick={onShowMessagesDialog}
          tooltipPosition="bottom-right" tooltip="Messages">
          <Message />
        </IconButton>
        <UAVToolbarSeparator />
        <IconButton disabled={isSelectionEmpty}
          tooltipPosition="bottom-right" tooltip="Halt">
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
}

UAVToolbar.propTypes = {
  isSelectionEmpty: PropTypes.bool,
  onShowMessagesDialog: PropTypes.func,
  selection: PropTypes.arrayOf(PropTypes.string)
}

export default connect(
  // mapStateToProps
  state => ({
    isSelectionEmpty: store.getState().map.selection.length === 0,
    selection: store.getState().map.selection
  }),
  // mapDispatchToProps
  dispatch => ({
    onShowMessagesDialog () {
      dispatch(showMessagesDialog())
    }
  })
)(UAVToolbar)

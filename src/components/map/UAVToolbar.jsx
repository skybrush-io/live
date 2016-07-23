import React from 'react'

import IconButton from 'material-ui/IconButton'
import ActionFlightTakeoff from 'material-ui/svg-icons/action/flight-takeoff'
import ActionFlightLand from 'material-ui/svg-icons/action/flight-land'
import ActionPowerSettingsNew from 'material-ui/svg-icons/action/power-settings-new'

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
export default class UAVToolbar extends React.Component {
  render () {
    return (
      <div>
        <IconButton onClick={this.takeoffSelectedUAVs_}
          tooltipPosition="bottom-right" tooltip="Takeoff">
          <ActionFlightTakeoff />
        </IconButton>
        <br />
        <IconButton onClick={this.landSelectedUAVs_}
          tooltipPosition="bottom-right" tooltip="Land">
          <ActionFlightLand />
        </IconButton>
        <UAVToolbarSeparator />
        <IconButton
          tooltipPosition="bottom-right" tooltip="Halt">
          <ActionPowerSettingsNew color="red" />
        </IconButton>
      </div>
    )
  }

  takeoffSelectedUAVs_ () {
    messageHub.sendMessage({
      type: 'UAV-TAKEOFF',
      ids: store.getState().map.selection
    }).then(result => console.log(result))
  }

  landSelectedUAVs_ () {
    messageHub.sendMessage({
      type: 'UAV-LAND',
      ids: store.getState().map.selection
    }).then(result => console.log(result))
  }
}

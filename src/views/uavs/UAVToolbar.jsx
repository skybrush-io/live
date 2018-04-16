import { autobind } from 'core-decorators'
import { isEmpty } from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import IconButton from 'material-ui/IconButton'
import Tooltip from 'material-ui/Tooltip'
import ActionFlightTakeoff from 'material-ui-icons/FlightTakeoff'
import ActionFlightLand from 'material-ui-icons/FlightLand'
import ActionHome from 'material-ui-icons/Home'
import ActionPowerSettingsNew from 'material-ui-icons/PowerSettingsNew'
import ImageBlurCircular from 'material-ui-icons/BlurCircular'
import ImageBlurOn from 'material-ui-icons/BlurOn'
import Message from 'material-ui-icons/Message'

import { selectUAVInMessagesDialog, showMessagesDialog } from '../../actions/messages'
import * as messaging from '../../utils/messaging'

/**
 * Main toolbar for controlling the UAVs.
 */
class UAVToolbar extends React.Component {
  render () {
    const { fitSelectedUAVs, selectedUAVIds } = this.props
    const isSelectionEmpty = isEmpty(selectedUAVIds)

    /* Buttons that can potentially become disabled must be wrapped in a
     * <span> to ensure that the tooltip still works. Otherwise the Tooltip
     * component gives us a warning anyway. */

    return (
      <div>
        <Tooltip placement='bottom' title='Takeoff'>
          <span>
            <IconButton disabled={isSelectionEmpty}
              onClick={() => messaging.takeoffUAVs(selectedUAVIds)}>
              <ActionFlightTakeoff />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip placement='bottom' title='Land'>
          <span>
            <IconButton disabled={isSelectionEmpty}
              onClick={() => messaging.landUAVs(selectedUAVIds)}>
              <ActionFlightLand />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip placement='bottom' title='Return to home'>
          <span>
            <IconButton disabled={isSelectionEmpty}
              onClick={() => messaging.returnToHomeUAVs(selectedUAVIds)}>
              <ActionHome />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip placement='bottom' title='Messages'>
          <IconButton onClick={this._showMessagesDialog}>
            <Message />
          </IconButton>
        </Tooltip>
        <Tooltip placement='bottom' title='Halt'>
          <span>
            <IconButton disabled={isSelectionEmpty}
              onClick={() => messaging.haltUAVs(selectedUAVIds)}>
              <ActionPowerSettingsNew color={isSelectionEmpty ? undefined : 'secondary'} />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip placement='bottom'
          title={isSelectionEmpty ? 'Fit all UAVs' : 'Fit selected UAVs'}>
          <IconButton
            onClick={fitSelectedUAVs}
            style={{
              float: 'right',
              padding: '0px',
              marginRight: '4px'
            }}>
            {isSelectionEmpty ? <ImageBlurOn /> : <ImageBlurCircular />}
          </IconButton>
        </Tooltip>
      </div>
    )
  }

  @autobind
  _showMessagesDialog () {
    if (this.props.selectedUAVIds.length === 1) {
      this.props.selectUAVInMessagesDialog(this.props.selectedUAVIds[0])
    }

    this.props.showMessagesDialog()
  }
}

UAVToolbar.propTypes = {
  fitSelectedUAVs: PropTypes.func,
  isSelectionEmpty: PropTypes.bool,
  selectUAVInMessagesDialog: PropTypes.func,
  showMessagesDialog: PropTypes.func,
  selectedUAVIds: PropTypes.arrayOf(PropTypes.string)
}

export default connect(
  // mapStateToProps
  (state, { fitSelectedUAVs }) => ({
    fitSelectedUAVs
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

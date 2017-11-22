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

import { selectUAVInMessagesDialog, showMessagesDialog } from '../actions/messages'
import * as messaging from '../utils/messaging'

import { coordinateFromLonLat } from '../utils/geography'
import ol from 'openlayers'
import { mapViewToExtentSignal } from '../signals'

/**
 * Main toolbar for controlling the UAVs.
 */
class UAVToolbar extends React.Component {
  constructor (props) {
    super(props)

    this._showMessagesDialog = this._showMessagesDialog.bind(this)

    this._fitSelectedUAVs = this._fitSelectedUAVs.bind(this)
  }

  render () {
    const { selectedUAVIds } = this.props
    const isSelectionEmpty = isEmpty(selectedUAVIds)

    return (
      <div>
        <Tooltip placement='bottom' title='Takeoff'>
          <IconButton disabled={isSelectionEmpty}
            onClick={() => messaging.takeoffUAVs(this.props.selectedUAVIds)}>
            <ActionFlightTakeoff />
          </IconButton>
        </Tooltip>
        <Tooltip placement='bottom' title='Land'>
          <IconButton disabled={isSelectionEmpty}
            onClick={() => messaging.landUAVs(this.props.selectedUAVIds)}>
            <ActionFlightLand />
          </IconButton>
        </Tooltip>
        <Tooltip placement='bottom' title='Return to home'>
          <IconButton disabled={isSelectionEmpty}
            onClick={() => messaging.returnToHomeUAVs(this.props.selectedUAVIds)}>
            <ActionHome />
          </IconButton>
        </Tooltip>
        <Tooltip placement='bottom' title='Messages'>
          <IconButton onClick={this._showMessagesDialog}>
            <Message />
          </IconButton>
        </Tooltip>
        <Tooltip placement='bottom' title='Halt'>
          <IconButton disabled={isSelectionEmpty}
            onClick={() => messaging.shutdownUAVs(this.props.selectedUAVIds)}>
            <ActionPowerSettingsNew color={isSelectionEmpty ? undefined : 'red'} />
          </IconButton>
        </Tooltip>

        <Tooltip placement='bottom'
          title={isSelectionEmpty ? 'Fit all UAVs' : 'Fit selected UAVs'}>
          <IconButton
            onClick={this._fitSelectedUAVs}
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

  _showMessagesDialog () {
    if (this.props.selectedUAVIds.length === 1) {
      this.props.selectUAVInMessagesDialog(this.props.selectedUAVIds[0])
    }

    this.props.showMessagesDialog()
  }

  _fitSelectedUAVs () {
    const selectedUAVCoordinates = this.props.uavs.toArray().filter(
      uav => this.props.selectedUAVIds.length === 0
        ? true
        : this.props.selectedUAVIds.includes(uav.id)
    ).map(
      uav => coordinateFromLonLat([uav.lon, uav.lat])
    )

    const boundingExtent = ol.extent.boundingExtent(selectedUAVCoordinates)
    const bufferedExtent = ol.extent.buffer(boundingExtent, 16)
    mapViewToExtentSignal.dispatch(bufferedExtent, 500)
  }
}

UAVToolbar.propTypes = {
  isSelectionEmpty: PropTypes.bool,
  selectUAVInMessagesDialog: PropTypes.func,
  showMessagesDialog: PropTypes.func,
  selectedUAVIds: PropTypes.arrayOf(PropTypes.string)
}

export default connect(
  // mapStateToProps
  state => ({}),
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

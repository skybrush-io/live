import { isEmpty } from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import IconButton from 'material-ui/IconButton'
import ActionFlightTakeoff from 'material-ui/svg-icons/action/flight-takeoff'
import ActionFlightLand from 'material-ui/svg-icons/action/flight-land'
import ActionHome from 'material-ui/svg-icons/action/home'
import ActionPowerSettingsNew from 'material-ui/svg-icons/action/power-settings-new'
import ImageBlurCircular from 'material-ui/svg-icons/image/blur-circular'
import ImageBlurOn from 'material-ui/svg-icons/image/blur-on'
import Message from 'material-ui/svg-icons/communication/message'

import { selectUAVInMessagesDialog, showMessagesDialog } from '../actions/messages'
import messageHub from '../message-hub'

import { coordinateFromLonLat } from '../utils/geography'
import ol from 'openlayers'
import { mapViewToExtentSignal } from '../signals'

/**
 * Main toolbar for controlling the UAVs.
 */
class UAVToolbar extends React.Component {
  constructor (props) {
    super(props)

    this._takeoffSelectedUAVs = this._takeoffSelectedUAVs.bind(this)
    this._landSelectedUAVs = this._landSelectedUAVs.bind(this)
    this._returnSelectedUAVs = this._returnSelectedUAVs.bind(this)

    this._showMessagesDialog = this._showMessagesDialog.bind(this)

    this._fitSelectedUAVs = this._fitSelectedUAVs.bind(this)
  }

  render () {
    const { selectedUAVIds } = this.props
    const isSelectionEmpty = isEmpty(selectedUAVIds)

    // Don't use material-ui native tooltips here because they won't work
    // nicely for disabled buttons; see https://github.com/callemall/material-ui/issues/3665
    return (
      <div>
        <IconButton disabled={isSelectionEmpty}
          onClick={this._takeoffSelectedUAVs}
          tooltipPosition={'bottom-right'} title={'Takeoff'}>
          <ActionFlightTakeoff />
        </IconButton>
        <IconButton disabled={isSelectionEmpty}
          onClick={this._landSelectedUAVs}
          tooltipPosition={'bottom-right'} title={'Land'}>
          <ActionFlightLand />
        </IconButton>
        <IconButton disabled={isSelectionEmpty}
          onClick={this._returnSelectedUAVs}
          tooltipPosition={'bottom-right'} title={'Return to home'}>
          <ActionHome />
        </IconButton>
        <IconButton
          onClick={this._showMessagesDialog}
          tooltipPosition={'bottom-right'} title={'Messages'}>
          <Message />
        </IconButton>
        <IconButton disabled={isSelectionEmpty}
          tooltipPosition={'bottom-right'} title={'Halt'}>
          <ActionPowerSettingsNew color={'red'} />
        </IconButton>

        <IconButton
          onClick={this._fitSelectedUAVs}
          tooltipPosition={'bottom-left'}
          style={{
            float: 'right',
            padding: '0px',
            marginRight: '4px'
          }}
          title={isSelectionEmpty ? 'Fit all UAVs' : 'Fit selected UAVs'}>
          {isSelectionEmpty ? <ImageBlurOn /> : <ImageBlurCircular />}
        </IconButton>
      </div>
    )
  }

  _takeoffSelectedUAVs () {
    messageHub.sendMessage({
      type: 'UAV-TAKEOFF',
      ids: this.props.selectedUAVIds
    }).then(result => console.log(result))
  }

  _landSelectedUAVs () {
    messageHub.sendMessage({
      type: 'UAV-LAND',
      ids: this.props.selectedUAVIds
    }).then(result => console.log(result))
  }

  _returnSelectedUAVs () {
    messageHub.sendMessage({
      type: 'UAV-RTH',
      ids: this.props.selectedUAVIds
    }).then(result => console.log(result))
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

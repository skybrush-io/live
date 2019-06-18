/**
 * @file Context menu using a Popover element that displays connands to send to the
 * currently selected UAVs.
 */

import { autobind } from 'core-decorators'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import Divider from '@material-ui/core/Divider'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import MenuItem from '@material-ui/core/MenuItem'

import ActionDelete from '@material-ui/icons/Delete'
import Edit from '@material-ui/icons/Edit'
import Flight from '@material-ui/icons/Flight'
import FlightTakeoff from '@material-ui/icons/FlightTakeoff'
import FlightLand from '@material-ui/icons/FlightLand'
import Home from '@material-ui/icons/Home'
import Message from '@material-ui/icons/Message'
import ActionPowerSettingsNew from '@material-ui/icons/PowerSettingsNew'
import PinDrop from '@material-ui/icons/PinDrop'

import { showFeatureEditorDialog } from '../../actions/feature-editor'
import { renameFeature, removeFeatures } from '../../actions/features'
import { setHomePosition } from '../../actions/map-origin'
import { selectUAVInMessagesDialog, showMessagesDialog } from '../../actions/messages'
import { showPromptDialog } from '../../actions/prompt'
import { showSnackbarMessage } from '../../actions/snackbar'
import ContextMenu from '../../components/ContextMenu'
import {
  getSelectedFeatureIds,
  getSelectedFeatureLabels,
  getSelectedUAVIds
} from '../../selectors/selection'
import * as messaging from '../../utils/messaging'

/**
 * Context menu that shows the menu items that should appear when the
 * user right-clicks on the map.
 */
class MapContextMenu extends React.Component {
  constructor (props) {
    super(props)

    this._contextMenu = React.createRef()
  }

  /**
   * Public method to open the context menu.
   *
   * @param {Object} position Coordinates where the absolutely positioned popup
   * should appear.
   * @property {number} x The value to forward as `left` into the style object.
   * @property {number} y The value to forward as `top` into the style object.
   * @param {Object} context  Context object to pass to the click handlers of
   *        the menu items in the context menu as their second argument
   */
  @autobind
  open (position, context) {
    if (this._contextMenu.current) {
      this._contextMenu.current.open(position, context)
    }
  }

  render () {
    return (
      <ContextMenu ref={this._contextMenu} contextProvider={this.props.contextProvider}>
        {({ selectedFeatureIds, selectedUAVIds }) => {
          const result = []
          const hasSelectedUAVs = selectedUAVIds && selectedUAVIds.length > 0
          const hasSingleSelectedUAV = selectedUAVIds && selectedUAVIds.length === 1
          const hasSelectedFeatures = selectedFeatureIds && selectedFeatureIds.length > 0

          if (hasSelectedUAVs) {
            result.push(
              <MenuItem key="fly" dense onClick={this._moveSelectedUAVsAtCurrentAltitude}>
                <ListItemIcon><Flight /></ListItemIcon>
                Fly here
              </MenuItem>,
              <MenuItem key="flyAtAltitude" dense onClick={this._moveSelectedUAVsAtGivenAltitude}>
                <ListItemIcon><Flight /></ListItemIcon>
                Fly here at altitude...
              </MenuItem>,
              <Divider key="div2" />,
              <MenuItem key="takeoff" dense onClick={this._takeoffSelectedUAVs}>
                <ListItemIcon><FlightTakeoff /></ListItemIcon>
                Takeoff
              </MenuItem>,
              <MenuItem key="land" dense onClick={this._landSelectedUAVs}>
                <ListItemIcon><FlightLand /></ListItemIcon>
                Land
              </MenuItem>,
              <MenuItem key="home" dense onClick={this._returnSelectedUAVs}>
                <ListItemIcon><Home /></ListItemIcon>
                Return to home
              </MenuItem>,
              <MenuItem key="message" dense disabled={!hasSingleSelectedUAV}
                onClick={this._showMessagesDialog}>
                <ListItemIcon><Message /></ListItemIcon>
                Messages
              </MenuItem>,
              <MenuItem key="shutdown" dense onClick={this._shutdownSelectedUAVs}>
                <ListItemIcon><ActionPowerSettingsNew color='secondary' /></ListItemIcon>
                Halt
              </MenuItem>,
              <Divider key="div1" />
            )
          }

          result.push(
            <MenuItem key="setOrigin" dense onClick={this._setOrigin}>
              <ListItemIcon><PinDrop /></ListItemIcon>
              Set origin here
            </MenuItem>
          )

          if (hasSelectedFeatures) {
            result.push(
              <Divider key="div2" />,
              <MenuItem key="setProperties" dense disabled={!selectedFeatureIds || selectedFeatureIds.length !== 1}
                onClick={this._editSelectedFeature}>
                <ListItemIcon><Edit /></ListItemIcon>
                Properties...
              </MenuItem>,
              <MenuItem key="remove" dense disabled={!selectedFeatureIds || selectedFeatureIds.length === 0}
                onClick={this._removeSelectedFeatures}>
                <ListItemIcon><ActionDelete /></ListItemIcon>
                Remove
              </MenuItem>
            )
          }

          return result
        }}
      </ContextMenu>
    )
  }

  @autobind
  _moveSelectedUAVsAtCurrentAltitude (event, context) {
    const { coords, selectedUAVIds } = context
    this._moveUAVs(selectedUAVIds, coords)
  }

  @autobind
  _moveSelectedUAVsAtGivenAltitude (event, context) {
    const coords = { ...context.coords }
    const selectedUAVIds = [...context.selectedUAVIds]

    this.props.showPromptDialog('Enter the target altitude').then(altitude => {
      if (altitude !== undefined) {
        const altitudeAsNumber = parseFloat(altitude)
        if (!isNaN(altitudeAsNumber)) {
          this._moveUAVs(selectedUAVIds, coords, altitudeAsNumber)
        } else {
          this.props.showErrorMessage('Invalid target altitude')
        }
      }
    })
  }

  @autobind
  _moveUAVs (uavIds, coords, agl) {
    if (coords && coords.length === 2) {
      messaging.moveUAVs(uavIds, {
        lat: coords[1],
        lon: coords[0],
        agl
      })
    }
  }

  @autobind
  _editSelectedFeature (event, context) {
    const { editFeature } = this.props
    const { selectedFeatureIds } = context
    if (selectedFeatureIds.length !== 1) {
      return
    }

    editFeature(selectedFeatureIds[0])
  }

  @autobind
  _takeoffSelectedUAVs (event, context) {
    const { selectedUAVIds } = context
    messaging.takeoffUAVs(selectedUAVIds)
  }

  @autobind
  _landSelectedUAVs (event, context) {
    const { selectedUAVIds } = context
    messaging.landUAVs(selectedUAVIds)
  }

  @autobind
  _renameSelectedFeature (event, context) {
    const { renameFeature } = this.props
    const { selectedFeatureIds, selectedFeatureLabels } = context

    if (selectedFeatureIds.length !== 1) {
      return
    }

    renameFeature(selectedFeatureIds[0], selectedFeatureLabels[0])
  }

  @autobind
  _removeSelectedFeatures (event, context) {
    const { selectedFeatureIds } = context
    this.props.removeFeaturesByIds(selectedFeatureIds)
  }

  @autobind
  _returnSelectedUAVs (event, context) {
    const { selectedUAVIds } = context
    messaging.returnToHomeUAVs(selectedUAVIds)
  }

  @autobind
  _setOrigin (event, context) {
    const { coords } = context
    if (coords) {
      this.props.setHomePosition(coords)
    }
  }

  @autobind
  _shutdownSelectedUAVs (event, context) {
    const { selectedUAVIds } = context
    messaging.haltUAVs(selectedUAVIds)
  }

  @autobind
  _showMessagesDialog (event, context) {
    const { selectedUAVIds } = context
    if (selectedUAVIds.length === 1) {
      this.props.selectUAVInMessagesDialog(selectedUAVIds[0])
    }
    this.props.showMessagesDialog()
  }
}

MapContextMenu.propTypes = {
  contextProvider: PropTypes.func,
  editFeature: PropTypes.func.isRequired,
  renameFeature: PropTypes.func.isRequired,
  removeFeaturesByIds: PropTypes.func.isRequired,
  selectUAVInMessagesDialog: PropTypes.func.isRequired,
  setHomePosition: PropTypes.func.isRequired,
  showErrorMessage: PropTypes.func.isRequired,
  showMessagesDialog: PropTypes.func.isRequired,
  showPromptDialog: PropTypes.func.isRequired
}

const MapContextMenuContainer = connect(
  // mapStateToProps
  state => ({
    contextProvider: context => ({
      selectedFeatureIds: getSelectedFeatureIds(state),
      selectedFeatureLabels: getSelectedFeatureLabels(state),
      selectedUAVIds: getSelectedUAVIds(state),
      ...context
    })
  }),
  // mapDispatchToProps
  dispatch => ({
    editFeature: id => {
      dispatch(showFeatureEditorDialog(id))
    },
    removeFeaturesByIds: (ids) => {
      dispatch(removeFeatures(ids))
    },
    renameFeature: (id, label) => {
      dispatch(
        showPromptDialog('Enter the new name of the feature', label)
      ).then(newLabel => {
        if (newLabel) {
          dispatch(renameFeature(id, newLabel))
        }
      })
    },
    selectUAVInMessagesDialog: (id) => {
      dispatch(selectUAVInMessagesDialog(id))
    },
    setHomePosition: coords => {
      dispatch(setHomePosition(coords))
    },
    showErrorMessage: message => {
      dispatch(showSnackbarMessage(message))
    },
    showMessagesDialog: () => {
      dispatch(showMessagesDialog())
    },
    showPromptDialog: (message, options) => {
      return dispatch(showPromptDialog(message, options))
    }
  }),
  null,
  { withRef: true }
)(MapContextMenu)

export default MapContextMenuContainer

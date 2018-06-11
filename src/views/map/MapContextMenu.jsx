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
    const { selectedFeatureIds, selectedUAVIds } = this.props
    return (
      <ContextMenu ref={this._contextMenu}>
        <MenuItem dense disabled={selectedUAVIds.length === 0}
          onClick={this._takeoffSelectedUAVs}>
          <ListItemIcon><FlightTakeoff /></ListItemIcon>
          Takeoff
        </MenuItem>
        <MenuItem dense disabled={selectedUAVIds.length === 0}
          onClick={this._landSelectedUAVs}>
          <ListItemIcon><FlightLand /></ListItemIcon>
          Land
        </MenuItem>
        <MenuItem dense disabled={selectedUAVIds.length === 0}
          onClick={this._returnSelectedUAVs}>
          <ListItemIcon><Home /></ListItemIcon>
          Return to home
        </MenuItem>
        <MenuItem dense disabled={selectedUAVIds.length !== 1}
          onClick={this._showMessagesDialog}>
          <ListItemIcon><Message /></ListItemIcon>
          Messages
        </MenuItem>
        <MenuItem dense disabled={selectedUAVIds.length === 0}
          onClick={this._shutdownSelectedUAVs}>
          <ListItemIcon><ActionPowerSettingsNew color='secondary' /></ListItemIcon>
          Halt
        </MenuItem>
        <Divider />
        <MenuItem dense onClick={this._setOrigin}>
          <ListItemIcon><PinDrop /></ListItemIcon>
          Set origin here
        </MenuItem>
        <Divider />
        <MenuItem dense disabled={selectedFeatureIds.length !== 1}
          onClick={this._editSelectedFeature}>
          <ListItemIcon><Edit /></ListItemIcon>
          Properties...
        </MenuItem>
        <MenuItem dense disabled={selectedFeatureIds.length === 0}
          onClick={this._removeSelectedFeatures}>
          <ListItemIcon><ActionDelete /></ListItemIcon>
          Remove
        </MenuItem>
      </ContextMenu>
    )
  }

  @autobind
  _editSelectedFeature () {
    const { editFeature, selectedFeatureIds } = this.props
    if (selectedFeatureIds.length !== 1) {
      return
    }

    editFeature(selectedFeatureIds[0])
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
  _renameSelectedFeature (event, context) {
    const { renameFeature, selectedFeatureIds,
      selectedFeatureLabels } = this.props
    if (selectedFeatureIds.length !== 1) {
      return
    }

    renameFeature(selectedFeatureIds[0], selectedFeatureLabels[0])
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
  _setOrigin (event, context) {
    const { coords } = context
    if (coords) {
      this.props.setHomePosition(coords)
    }
  }

  @autobind
  _shutdownSelectedUAVs () {
    messaging.haltUAVs(this.props.selectedUAVIds)
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
  editFeature: PropTypes.func.isRequired,
  renameFeature: PropTypes.func.isRequired,
  removeFeaturesByIds: PropTypes.func.isRequired,
  selectedFeatureIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedFeatureLabels: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedUAVIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectUAVInMessagesDialog: PropTypes.func.isRequired,
  setHomePosition: PropTypes.func.isRequired,
  showMessagesDialog: PropTypes.func.isRequired
}

const MapContextMenuContainer = connect(
  // mapStateToProps
  state => ({
    selectedFeatureIds: getSelectedFeatureIds(state),
    selectedFeatureLabels: getSelectedFeatureLabels(state),
    selectedUAVIds: getSelectedUAVIds(state)
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
    showMessagesDialog: () => {
      dispatch(showMessagesDialog())
    }
  }),
  null,
  { withRef: true }
)(MapContextMenu)

export default MapContextMenuContainer

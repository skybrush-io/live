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
import ActionFlightTakeoff from '@material-ui/icons/FlightTakeoff'
import ActionFlightLand from '@material-ui/icons/FlightLand'
import ActionHome from '@material-ui/icons/Home'
import ActionPowerSettingsNew from '@material-ui/icons/PowerSettingsNew'
import ImageEdit from '@material-ui/icons/Edit'
import Message from '@material-ui/icons/Message'

import ContextMenu from '../../components/ContextMenu'

import { showFeatureEditorDialog } from '../../actions/feature-editor'
import { renameFeature, removeFeatures } from '../../actions/features'
import { selectUAVInMessagesDialog, showMessagesDialog } from '../../actions/messages'
import { showPromptDialog } from '../../actions/prompt'
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
   */
  @autobind
  open (position) {
    if (this._contextMenu.current) {
      this._contextMenu.current.open(position)
    }
  }

  render () {
    const { selectedFeatureIds, selectedUAVIds } = this.props
    return (
      <ContextMenu ref={this._contextMenu}>
        <MenuItem dense disabled={selectedUAVIds.length === 0}
          onClick={this._takeoffSelectedUAVs}>
          <ListItemIcon><ActionFlightTakeoff /></ListItemIcon>
          Takeoff
        </MenuItem>
        <MenuItem dense disabled={selectedUAVIds.length === 0}
          onClick={this._landSelectedUAVs}>
          <ListItemIcon><ActionFlightLand /></ListItemIcon>
          Land
        </MenuItem>
        <MenuItem dense disabled={selectedUAVIds.length === 0}
          onClick={this._returnSelectedUAVs}>
          <ListItemIcon><ActionHome /></ListItemIcon>
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
        <MenuItem dense disabled={selectedFeatureIds.length !== 1}
          onClick={this._editSelectedFeature}>
          <ListItemIcon><ImageEdit /></ListItemIcon>
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
  _renameSelectedFeature () {
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
    showMessagesDialog: () => {
      dispatch(showMessagesDialog())
    }
  }),
  null,
  { withRef: true }
)(MapContextMenu)

export default MapContextMenuContainer

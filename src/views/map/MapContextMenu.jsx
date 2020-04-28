/**
 * @file Context menu using a Popover element that displays connands to send to the
 * currently selected UAVs.
 */

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Divider from '@material-ui/core/Divider';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import MenuItem from '@material-ui/core/MenuItem';

import ActionDelete from '@material-ui/icons/Delete';
import Edit from '@material-ui/icons/Edit';
import Flight from '@material-ui/icons/Flight';
import FlightTakeoff from '@material-ui/icons/FlightTakeoff';
import FlightLand from '@material-ui/icons/FlightLand';
import Grain from '@material-ui/icons/Grain';
import Home from '@material-ui/icons/Home';
import Message from '@material-ui/icons/Message';
import ActionPowerSettingsNew from '@material-ui/icons/PowerSettingsNew';
import PinDrop from '@material-ui/icons/PinDrop';
import Refresh from '@material-ui/icons/Refresh';

import { createSelector } from '@reduxjs/toolkit';

import { showFeatureEditorDialog } from '../../actions/feature-editor';
import { renameFeature, removeFeatures } from '../../actions/features';
import { setFlatEarthCoordinateSystemOrigin } from '../../actions/map-origin';
import {
  selectUAVInMessagesDialog,
  showMessagesDialog,
} from '../../actions/messages';
import { showPromptDialog } from '../../actions/prompt';
import ContextMenu from '../../components/ContextMenu';
import {
  getSelectedFeatureIds,
  getSelectedFeatureLabels,
  getSelectedUAVIds,
} from '../../selectors/selection';
import * as messaging from '../../utils/messaging';

import { updateOutdoorShowSettings } from '~/features/show/actions';
import { showSnackbarMessage } from '~/features/snackbar/slice';

/**
 * Context menu that shows the menu items that should appear when the
 * user right-clicks on the map.
 */
class MapContextMenu extends React.Component {
  static propTypes = {
    contextProvider: PropTypes.func,
    editFeature: PropTypes.func.isRequired,
    renameFeature: PropTypes.func.isRequired,
    removeFeaturesByIds: PropTypes.func.isRequired,
    selectUAVInMessagesDialog: PropTypes.func.isRequired,
    setMapCoordinateSystemOrigin: PropTypes.func,
    setShowCoordinateSystemOrigin: PropTypes.func,
    showErrorMessage: PropTypes.func.isRequired,
    showMessagesDialog: PropTypes.func.isRequired,
    showPromptDialog: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);

    this._contextMenu = React.createRef();
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
  open = (position, context) => {
    if (this._contextMenu.current) {
      this._contextMenu.current.open(position, context);
    }
  };

  render() {
    return (
      <ContextMenu
        ref={this._contextMenu}
        contextProvider={this.props.contextProvider}
      >
        {({ selectedFeatureIds, selectedUAVIds }) => {
          const result = [];
          const hasSelectedUAVs = selectedUAVIds && selectedUAVIds.length > 0;
          const hasSingleSelectedUAV =
            selectedUAVIds && selectedUAVIds.length === 1;
          const hasSelectedFeatures =
            selectedFeatureIds && selectedFeatureIds.length > 0;

          if (hasSelectedUAVs) {
            result.push(
              <MenuItem
                key='fly'
                dense
                onClick={this._moveSelectedUAVsAtCurrentAltitude}
              >
                <ListItemIcon>
                  <Flight />
                </ListItemIcon>
                Fly here
              </MenuItem>,
              <MenuItem
                key='flyAtAltitude'
                dense
                onClick={this._moveSelectedUAVsAtGivenAltitude}
              >
                <ListItemIcon>
                  <Flight />
                </ListItemIcon>
                Fly here at altitude…
              </MenuItem>,
              <Divider key='div1' />,
              <MenuItem key='takeoff' dense onClick={this._takeoffSelectedUAVs}>
                <ListItemIcon>
                  <FlightTakeoff />
                </ListItemIcon>
                Takeoff
              </MenuItem>,
              <MenuItem key='land' dense onClick={this._landSelectedUAVs}>
                <ListItemIcon>
                  <FlightLand />
                </ListItemIcon>
                Land
              </MenuItem>,
              <MenuItem key='home' dense onClick={this._returnSelectedUAVs}>
                <ListItemIcon>
                  <Home />
                </ListItemIcon>
                Return to home
              </MenuItem>,
              <MenuItem
                key='message'
                dense
                disabled={!hasSingleSelectedUAV}
                onClick={this._showMessagesDialog}
              >
                <ListItemIcon>
                  <Message />
                </ListItemIcon>
                Messages
              </MenuItem>,
              <Divider key='div2' />,
              <MenuItem key='reset' dense onClick={this._resetSelectedUAVs}>
                <ListItemIcon>
                  <Refresh color='secondary' />
                </ListItemIcon>
                Reboot
              </MenuItem>,
              <MenuItem
                key='shutdown'
                dense
                onClick={this._shutdownSelectedUAVs}
              >
                <ListItemIcon>
                  <ActionPowerSettingsNew color='secondary' />
                </ListItemIcon>
                Halt
              </MenuItem>,
              <Divider key='div3' />
            );
          }

          if (this.props.setMapCoordinateSystemOrigin) {
            result.push(
              <MenuItem
                key='setMapCoordinateSystemOrigin'
                dense
                onClick={this._setMapCoordinateSystemOrigin}
              >
                <ListItemIcon>
                  <PinDrop />
                </ListItemIcon>
                Set map origin here
              </MenuItem>
            );
          }

          if (this.props.setShowCoordinateSystemOrigin) {
            result.push(
              <MenuItem
                key='setShowCoordinateSystemOrigin'
                dense
                onClick={this._setShowCoordinateSystemOrigin}
              >
                <ListItemIcon>
                  <Grain />
                </ListItemIcon>
                Set show origin here
              </MenuItem>
            );
          }

          if (hasSelectedFeatures) {
            result.push(
              <Divider key='div4' />,
              <MenuItem
                key='setProperties'
                dense
                disabled={
                  !selectedFeatureIds || selectedFeatureIds.length !== 1
                }
                onClick={this._editSelectedFeature}
              >
                <ListItemIcon>
                  <Edit />
                </ListItemIcon>
                \n Properties…\n
              </MenuItem>,
              <MenuItem
                key='remove'
                dense
                disabled={
                  !selectedFeatureIds || selectedFeatureIds.length === 0
                }
                onClick={this._removeSelectedFeatures}
              >
                <ListItemIcon>
                  <ActionDelete />
                </ListItemIcon>
                Remove
              </MenuItem>
            );
          }

          return result;
        }}
      </ContextMenu>
    );
  }

  _moveSelectedUAVsAtCurrentAltitude = (event, context) => {
    const { coords, selectedUAVIds } = context;
    this._moveUAVs(selectedUAVIds, coords);
  };

  _moveSelectedUAVsAtGivenAltitude = async (event, context) => {
    const coords = [...context.coords];
    const selectedUAVIds = [...context.selectedUAVIds];

    const altitude = await this.props.showPromptDialog(
      'Enter the target altitude'
    );
    if (altitude !== undefined) {
      const altitudeAsNumber = Number.parseFloat(altitude);
      if (Number.isNaN(altitudeAsNumber)) {
        this.props.showErrorMessage('Invalid target altitude');
      } else {
        this._moveUAVs(selectedUAVIds, coords, altitudeAsNumber);
      }
    }
  };

  _moveUAVs = (uavIds, coords, agl) => {
    if (coords && coords.length === 2) {
      messaging.moveUAVs(uavIds, {
        lat: coords[1],
        lon: coords[0],
        agl,
      });
    }
  };

  _editSelectedFeature = (event, context) => {
    const { editFeature } = this.props;
    const { selectedFeatureIds } = context;
    if (selectedFeatureIds.length !== 1) {
      return;
    }

    editFeature(selectedFeatureIds[0]);
  };

  _takeoffSelectedUAVs = (event, context) => {
    const { selectedUAVIds } = context;
    messaging.takeoffUAVs(selectedUAVIds);
  };

  _landSelectedUAVs = (event, context) => {
    const { selectedUAVIds } = context;
    messaging.landUAVs(selectedUAVIds);
  };

  _renameSelectedFeature = (event, context) => {
    const { renameFeature } = this.props;
    const { selectedFeatureIds, selectedFeatureLabels } = context;

    if (selectedFeatureIds.length !== 1) {
      return;
    }

    renameFeature(selectedFeatureIds[0], selectedFeatureLabels[0]);
  };

  _removeSelectedFeatures = (event, context) => {
    const { selectedFeatureIds } = context;
    this.props.removeFeaturesByIds(selectedFeatureIds);
  };

  _resetSelectedUAVs = (event, context) => {
    const { selectedUAVIds } = context;
    messaging.resetUAVs(selectedUAVIds);
  };

  _returnSelectedUAVs = (event, context) => {
    const { selectedUAVIds } = context;
    messaging.returnToHomeUAVs(selectedUAVIds);
  };

  _setMapCoordinateSystemOrigin = (event, context) => {
    const { coords } = context;
    if (coords) {
      this.props.setMapCoordinateSystemOrigin(coords);
    }
  };

  _setShowCoordinateSystemOrigin = (event, context) => {
    const { coords } = context;
    if (coords) {
      this.props.setShowCoordinateSystemOrigin(coords);
    }
  };

  _shutdownSelectedUAVs = (event, context) => {
    const { selectedUAVIds } = context;
    messaging.haltUAVs(selectedUAVIds);
  };

  _showMessagesDialog = (event, context) => {
    const { selectedUAVIds } = context;
    if (selectedUAVIds.length === 1) {
      this.props.selectUAVInMessagesDialog(selectedUAVIds[0]);
    }

    this.props.showMessagesDialog();
  };
}

const getContextProvider = createSelector(
  getSelectedFeatureIds,
  getSelectedFeatureLabels,
  getSelectedUAVIds,
  (selectedFeatureIds, selectedFeatureLabels, selectedUAVIds) => (context) => ({
    selectedFeatureIds,
    selectedFeatureLabels,
    selectedUAVIds,
    ...context,
  })
);

const MapContextMenuContainer = connect(
  // mapStateToProps
  (state) => ({
    contextProvider: getContextProvider(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    editFeature: (id) => {
      dispatch(showFeatureEditorDialog(id));
    },
    removeFeaturesByIds: (ids) => {
      dispatch(removeFeatures(ids));
    },
    renameFeature: (id, label) => {
      dispatch(
        showPromptDialog('Enter the new name of the feature', label)
      ).then((newLabel) => {
        if (newLabel) {
          dispatch(renameFeature(id, newLabel));
        }
      });
    },
    selectUAVInMessagesDialog: (id) => {
      dispatch(selectUAVInMessagesDialog(id));
    },
    setMapCoordinateSystemOrigin: (coords) => {
      dispatch(setFlatEarthCoordinateSystemOrigin(coords));
    },
    setShowCoordinateSystemOrigin: (coords) => {
      dispatch(
        updateOutdoorShowSettings({ origin: coords, setupMission: true })
      );
    },
    showErrorMessage: (message) => {
      dispatch(showSnackbarMessage(message));
    },
    showMessagesDialog: () => {
      dispatch(showMessagesDialog());
    },
    showPromptDialog: (message, options) => {
      return dispatch(showPromptDialog(message, options));
    },
  }),
  null,
  { forwardRef: true }
)(MapContextMenu);

export default MapContextMenuContainer;

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

import Add from '@material-ui/icons/Add';
import ActionDelete from '@material-ui/icons/Delete';
import Assignment from '@material-ui/icons/Assignment';
import Block from '@material-ui/icons/Block';
import ContentCut from '~/icons/ContentCut';
import Edit from '@material-ui/icons/Edit';
import Flight from '@material-ui/icons/Flight';
import FlightTakeoff from '@material-ui/icons/FlightTakeoff';
import FlightLand from '@material-ui/icons/FlightLand';
import Grain from '@material-ui/icons/Grain';
import Home from '@material-ui/icons/Home';
import Moon from '@material-ui/icons/NightsStay';
import PositionHold from '@material-ui/icons/Flag';
import ActionPowerSettingsNew from '@material-ui/icons/PowerSettingsNew';
import PinDrop from '@material-ui/icons/PinDrop';
import Refresh from '@material-ui/icons/Refresh';

import { createSelector } from '@reduxjs/toolkit';

import ContextMenu from '~/components/ContextMenu';
import Bolt from '~/icons/Bolt';
import Fence from '~/icons/PlacesFence';
import { FeatureType } from '~/model/features';
import { hasFeature } from '~/utils/configuration';
import * as messaging from '~/utils/messaging';

import { setFlatEarthCoordinateSystemOrigin } from '~/features/map/origin';
import {
  cutFeature,
  showFeatureEditorDialog,
} from '~/features/map-features/actions';
import { getSelectedFeatures } from '~/features/map-features/selectors';
import {
  removeFeaturesByIds,
  updateFeatureAttributes,
} from '~/features/map-features/slice';
import { addNewWaypointMissionItem } from '~/features/mission/actions';
import {
  clearGeofencePolygonId,
  setGeofencePolygonId,
} from '~/features/mission/slice';
import { getGeofencePolygonId } from '~/features/mission/selectors';
import { updateOutdoorShowSettings } from '~/features/show/actions';
import { openFlyToTargetDialogWithCoordinate } from '~/features/uav-control/actions';
import { openUAVDetailsDialog } from '~/features/uavs/details';
import { getSelectedUAVIds } from '~/features/uavs/selectors';

/**
 * Context menu that shows the menu items that should appear when the
 * user right-clicks on the map.
 */
class MapContextMenu extends React.Component {
  static propTypes = {
    addPointToMission: PropTypes.func,
    clearGeofencePolygonId: PropTypes.func,
    contextProvider: PropTypes.func,
    cutFeature: PropTypes.func,
    editFeature: PropTypes.func,
    openUAVDetailsDialog: PropTypes.func,
    removeFeaturesByIds: PropTypes.func,
    setGeofencePolygonId: PropTypes.func,
    setMapCoordinateSystemOrigin: PropTypes.func,
    setShowCoordinateSystemOrigin: PropTypes.func,
    showFlyToTargetDialog: PropTypes.func,
    updateFeatureAttributes: PropTypes.func,
  };

  constructor() {
    super();
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
        {({ selectedFeatures, selectedUAVIds, geofencePolygonId }) => {
          const result = [];
          const hasSelectedFeatures = selectedFeatures?.length > 0;
          const hasSingleSelectedFeature = selectedFeatures?.length === 1;
          const hasSelectedUAVs = selectedUAVIds?.length > 0;
          const hasSingleSelectedUAV = selectedUAVIds?.length === 1;

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
              <MenuItem
                key='poshold'
                dense
                onClick={this._positionHoldSelectedUAVs}
              >
                <ListItemIcon>
                  <PositionHold />
                </ListItemIcon>
                Position hold
              </MenuItem>,
              <MenuItem key='home' dense onClick={this._returnSelectedUAVs}>
                <ListItemIcon>
                  <Home />
                </ListItemIcon>
                Return to home
              </MenuItem>,
              <MenuItem key='land' dense onClick={this._landSelectedUAVs}>
                <ListItemIcon>
                  <FlightLand />
                </ListItemIcon>
                Land
              </MenuItem>,
              <Divider key='div2' />,
              <MenuItem
                key='message'
                dense
                disabled={!hasSingleSelectedUAV}
                onClick={this._openDetailsDialogForSelectedUAVs}
              >
                <ListItemIcon>
                  <Assignment />
                </ListItemIcon>
                Details...
              </MenuItem>,
              <Divider key='div3' />,
              <MenuItem key='wakeUp' dense onClick={this._wakeUpSelectedUAVs}>
                <ListItemIcon>
                  <Bolt />
                </ListItemIcon>
                Power on
              </MenuItem>,
              <MenuItem key='sleep' dense onClick={this._sleepSelectedUAVs}>
                <ListItemIcon>
                  <Moon />
                </ListItemIcon>
                Sleep
              </MenuItem>,
              <MenuItem key='reset' dense onClick={this._resetUAVs}>
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
                Power off
              </MenuItem>,
              <Divider key='div4' />
            );
          }

          if (this.props.addPointToMission) {
            result.push(
              <MenuItem
                key='addPointToMission'
                dense
                onClick={this._addPointToMission}
              >
                <ListItemIcon>
                  <Add />
                </ListItemIcon>
                Add point to mission
              </MenuItem>
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

          if (hasSingleSelectedFeature) {
            const featureSuitableForGeofence = [
              // FeatureType.CIRCLE,
              FeatureType.POLYGON,
            ].includes(selectedFeatures[0].type);
            const isCurrentGeofence =
              selectedFeatures[0].id === geofencePolygonId;
            result.push(
              <Divider key='div5' />,
              <MenuItem
                key='geofence'
                dense
                disabled={!featureSuitableForGeofence}
                onClick={
                  isCurrentGeofence
                    ? this._unsetSelectedFeatureAsGeofence
                    : this._setSelectedFeatureAsGeofence
                }
              >
                <ListItemIcon>
                  <Fence color={isCurrentGeofence ? 'disabled' : 'action'} />
                </ListItemIcon>
                {isCurrentGeofence ? 'Clear geofence' : 'Use as geofence'}
              </MenuItem>
            );

            const featureSuitableForExclusionZone = [
              FeatureType.POLYGON,
            ].includes(selectedFeatures[0].type);
            const isExclusionZone =
              selectedFeatures[0].attributes?.isExclusionZone;
            result.push(
              <MenuItem
                key='exclusionZone'
                dense
                disabled={!featureSuitableForExclusionZone}
                onClick={
                  isExclusionZone
                    ? this._unsetSelectedFeatureAsExclusionZone
                    : this._setSelectedFeatureAsExclusionZone
                }
              >
                <ListItemIcon>
                  <Block color={isExclusionZone ? 'disabled' : 'action'} />
                </ListItemIcon>
                {isExclusionZone
                  ? 'Clear exclusion zone'
                  : 'Use as exclusion zone'}
              </MenuItem>
            );
          }

          if (
            hasSelectedFeatures &&
            selectedFeatures.length === 2 &&
            selectedFeatures.every((t) => t.type === FeatureType.POLYGON)
          ) {
            result.push(
              <MenuItem key='cut' dense onClick={this._cutSelectedFeatures}>
                <ListItemIcon>
                  <ContentCut />
                </ListItemIcon>
                Subtract {selectedFeatures[0].label ?? 'unnamed polygon'} from{' '}
                {selectedFeatures[1].label ?? 'unnamed polygon'}
              </MenuItem>
            );
          }

          if (hasSelectedFeatures) {
            result.push(
              <Divider key='div6' />,
              <MenuItem
                key='setProperties'
                dense
                disabled={!hasSingleSelectedFeature}
                onClick={this._editSelectedFeature}
              >
                <ListItemIcon>
                  <Edit />
                </ListItemIcon>
                Properties…
              </MenuItem>,
              <MenuItem
                key='remove'
                dense
                disabled={!hasSelectedFeatures}
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

  _addPointToMission = (_event, context) => {
    const { coords } = context;
    const { addPointToMission } = this.props;
    if (addPointToMission) {
      addPointToMission({ lat: coords[1], lon: coords[0] });
    }
  };

  _moveSelectedUAVsAtCurrentAltitude = (_event, context) => {
    const { coords, selectedUAVIds } = context;
    messaging.moveUAVs(selectedUAVIds, {
      target: {
        lat: coords[1],
        lon: coords[0],
      },
    });
  };

  _moveSelectedUAVsAtGivenAltitude = async (_event, context) => {
    const coords = [...context.coords];
    const selectedUAVIds = [...context.selectedUAVIds];
    /* TODO(ntamas): use AHL of selected UAVs */
    this.props.showFlyToTargetDialog({ coords, uavIds: selectedUAVIds });
  };

  _cutSelectedFeatures = (_event, context) => {
    const { cutFeature } = this.props;
    const { selectedFeatures } = context;

    if (cutFeature) {
      cutFeature(selectedFeatures[1].id, selectedFeatures[0].id);
    }
  };

  _editSelectedFeature = (_event, context) => {
    const { editFeature } = this.props;
    const { selectedFeatures } = context;

    if (editFeature) {
      editFeature(selectedFeatures[0].id);
    }
  };

  _takeoffSelectedUAVs = (_event, context) => {
    const { selectedUAVIds } = context;
    messaging.takeoffUAVs(selectedUAVIds);
  };

  _landSelectedUAVs = (_event, context) => {
    const { selectedUAVIds } = context;
    messaging.landUAVs(selectedUAVIds);
  };

  _positionHoldSelectedUAVs = (_event, context) => {
    const { selectedUAVIds } = context;
    messaging.positionHoldUAVs(selectedUAVIds);
  };

  _unsetSelectedFeatureAsGeofence = (_event, _context) => {
    const { clearGeofencePolygonId } = this.props;
    if (clearGeofencePolygonId) {
      clearGeofencePolygonId();
    }
  };

  _setSelectedFeatureAsGeofence = (_event, context) => {
    const { setGeofencePolygonId } = this.props;
    const { selectedFeatures } = context;

    if (setGeofencePolygonId) {
      setGeofencePolygonId(selectedFeatures[0].id);
    }
  };

  _unsetSelectedFeatureAsExclusionZone = (_event, context) => {
    const { updateFeatureAttributes } = this.props;
    const { selectedFeatures } = context;

    if (updateFeatureAttributes) {
      updateFeatureAttributes({
        id: selectedFeatures[0].id,
        attributes: { isExclusionZone: false },
      });
    }
  };

  _setSelectedFeatureAsExclusionZone = (_event, context) => {
    const { updateFeatureAttributes } = this.props;
    const { selectedFeatures } = context;

    if (updateFeatureAttributes) {
      updateFeatureAttributes({
        id: selectedFeatures[0].id,
        attributes: { isExclusionZone: true },
      });
    }
  };

  _openDetailsDialogForSelectedUAVs = (_event, context) => {
    const { selectedUAVIds } = context;
    const { openUAVDetailsDialog } = this.props;

    if (openUAVDetailsDialog && selectedUAVIds.length > 0) {
      openUAVDetailsDialog(selectedUAVIds[0]);
    }
  };

  _removeSelectedFeatures = (_event, context) => {
    const { selectedFeatures } = context;
    const { removeFeaturesByIds } = this.props;

    if (removeFeaturesByIds) {
      removeFeaturesByIds(selectedFeatures.map((feature) => feature.id));
    }
  };

  _resetUAVs = (_event, context) => {
    const { selectedUAVIds } = context;
    messaging.resetUAVs(selectedUAVIds);
  };

  _returnSelectedUAVs = (_event, context) => {
    const { selectedUAVIds } = context;
    messaging.returnToHomeUAVs(selectedUAVIds);
  };

  _setMapCoordinateSystemOrigin = (_event, context) => {
    const { coords } = context;
    if (coords) {
      this.props.setMapCoordinateSystemOrigin(coords);
    }
  };

  _setShowCoordinateSystemOrigin = (_event, context) => {
    const { coords } = context;
    if (coords) {
      this.props.setShowCoordinateSystemOrigin(coords);
    }
  };

  _sleepSelectedUAVs = (_event, context) => {
    const { selectedUAVIds } = context;
    messaging.sleepUAVs(selectedUAVIds);
  };

  _shutdownSelectedUAVs = (_event, context) => {
    const { selectedUAVIds } = context;
    messaging.shutdownUAVs(selectedUAVIds);
  };

  _wakeUpSelectedUAVs = (_event, context) => {
    const { selectedUAVIds } = context;
    messaging.wakeUpUAVs(selectedUAVIds);
  };
}

const hasMapFeatures = hasFeature('mapFeatures');
const hasMissionEditor = hasFeature('missionEditor');
const hasGeofence = hasFeature('geofence');
const hasShowControl = hasFeature('showControl');

const getContextProvider = createSelector(
  getSelectedFeatures,
  getSelectedUAVIds,
  getGeofencePolygonId,
  (selectedFeatures, selectedUAVIds, geofencePolygonId) => (context) => ({
    selectedFeatures,
    selectedUAVIds,
    geofencePolygonId,
    ...context,
  })
);

const MapContextMenuContainer = connect(
  // mapStateToProps
  (state) => ({
    contextProvider: getContextProvider(state),
  }),
  // mapDispatchToProps
  {
    addPointToMission: hasMissionEditor ? addNewWaypointMissionItem : null,
    clearGeofencePolygonId: hasGeofence ? clearGeofencePolygonId : null,
    cutFeature: hasMapFeatures ? cutFeature : null,
    editFeature: hasMapFeatures ? showFeatureEditorDialog : null,
    openUAVDetailsDialog,
    removeFeaturesByIds: hasMapFeatures ? removeFeaturesByIds : null,
    setGeofencePolygonId: hasGeofence ? setGeofencePolygonId : null,
    setMapCoordinateSystemOrigin: setFlatEarthCoordinateSystemOrigin,
    setShowCoordinateSystemOrigin: hasShowControl
      ? (coords) =>
          updateOutdoorShowSettings({ origin: coords, setupMission: true })
      : null,
    showFlyToTargetDialog: openFlyToTargetDialogWithCoordinate,
    updateFeatureAttributes,
  },
  null,
  { forwardRef: true }
)(MapContextMenu);

export default MapContextMenuContainer;

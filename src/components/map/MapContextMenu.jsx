/**
 * @file Context menu using a Popover element that displays connands to send to the
 * currently selected UAVs.
 */

import Add from '@mui/icons-material/Add';
import Assignment from '@mui/icons-material/Assignment';
import Block from '@mui/icons-material/Block';
import ActionDelete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import PositionHold from '@mui/icons-material/Flag';
import Flight from '@mui/icons-material/Flight';
import FlightLand from '@mui/icons-material/FlightLand';
import FlightTakeoff from '@mui/icons-material/FlightTakeoff';
import Grain from '@mui/icons-material/Grain';
import Home from '@mui/icons-material/Home';
import Moon from '@mui/icons-material/NightsStay';
import PinDrop from '@mui/icons-material/PinDrop';
import ActionPowerSettingsNew from '@mui/icons-material/PowerSettingsNew';
import Refresh from '@mui/icons-material/Refresh';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuItem from '@mui/material/MenuItem';
import PropTypes from 'prop-types';
import type React from 'react';
import { Translation } from 'react-i18next';

import ContextMenu from '~/components/ContextMenu';
import Bolt from '~/icons/Bolt';
import ContentCut from '~/icons/ContentCut';
import Fence from '~/icons/PlacesFence';
import { FeatureType } from '~/model/features';
import * as messaging from '~/utils/messaging';

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
      <Translation>
        {(t) => (
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
                    {t('mapContextMenu.flyHere')}
                  </MenuItem>,
                  <MenuItem
                    key='flyAtAltitude'
                    dense
                    onClick={this._moveSelectedUAVsAtGivenAltitude}
                  >
                    <ListItemIcon>
                      <Flight />
                    </ListItemIcon>
                    {t('mapContextMenu.flyHereAtAltitude')}
                  </MenuItem>,
                  <Divider key='div1' />,
                  <MenuItem
                    key='takeoff'
                    dense
                    onClick={this._takeoffSelectedUAVs}
                  >
                    <ListItemIcon>
                      <FlightTakeoff />
                    </ListItemIcon>
                    {t('general.commands.takeoff')}
                  </MenuItem>,
                  <MenuItem
                    key='poshold'
                    dense
                    onClick={this._positionHoldSelectedUAVs}
                  >
                    <ListItemIcon>
                      <PositionHold />
                    </ListItemIcon>
                    {t('general.commands.positionHold')}
                  </MenuItem>,
                  <MenuItem key='home' dense onClick={this._returnSelectedUAVs}>
                    <ListItemIcon>
                      <Home />
                    </ListItemIcon>
                    {t('general.commands.returnToHome')}
                  </MenuItem>,
                  <MenuItem key='land' dense onClick={this._landSelectedUAVs}>
                    <ListItemIcon>
                      <FlightLand />
                    </ListItemIcon>
                    {t('general.commands.land')}
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
                    {t('mapContextMenu.details')}
                  </MenuItem>,
                  <Divider key='div3' />,
                  <MenuItem
                    key='wakeUp'
                    dense
                    onClick={this._wakeUpSelectedUAVs}
                  >
                    <ListItemIcon>
                      <Bolt />
                    </ListItemIcon>
                    {t('general.commands.powerOn')}
                  </MenuItem>,
                  <MenuItem key='sleep' dense onClick={this._sleepSelectedUAVs}>
                    <ListItemIcon>
                      <Moon />
                    </ListItemIcon>
                    {t('general.commands.sleep')}
                  </MenuItem>,
                  <MenuItem key='reset' dense onClick={this._resetUAVs}>
                    <ListItemIcon>
                      <Refresh color='secondary' />
                    </ListItemIcon>
                    {t('general.commands.reboot')}
                  </MenuItem>,
                  <MenuItem
                    key='shutdown'
                    dense
                    onClick={this._shutdownSelectedUAVs}
                  >
                    <ListItemIcon>
                      <ActionPowerSettingsNew color='secondary' />
                    </ListItemIcon>
                    {t('general.commands.powerOff')}
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
                    {t('mapContextMenu.setMapOriginHere')}
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
                    {t('mapContextMenu.setShowOriginHere')}
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
                      <Fence
                        color={isCurrentGeofence ? 'disabled' : 'action'}
                      />
                    </ListItemIcon>
                    {isCurrentGeofence
                      ? t('mapContextMenu.clearGeofence')
                      : t('mapContextMenu.useAsGeofence')}
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
                      ? t('mapContextMenu.clearExclusionZone')
                      : t('mapContextMenu.useAsExclusionZone')}
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
                    {t('mapContextMenu.subtractPolygon', {
                      minuend:
                        selectedFeatures[1].label ??
                        t('mapContextMenu.unnamedPolygon'),
                      subtrahend:
                        selectedFeatures[0].label ??
                        t('mapContextMenu.unnamedPolygon'),
                    })}
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
                    {t('mapContextMenu.properties')}
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
                    {t('general.action.remove')}
                  </MenuItem>
                );
              }

              return result;
            }}
          </ContextMenu>
        )}
      </Translation>
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
      if (selectedFeatures[0].attributes?.isExclusionZone) {
        this._unsetSelectedFeatureAsExclusionZone(_event, context);
      }

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
    const { geofencePolygonId, selectedFeatures } = context;

    if (updateFeatureAttributes) {
      if (selectedFeatures[0].id === geofencePolygonId) {
        this._unsetSelectedFeatureAsGeofence(_event, context);
      }

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

export default MapContextMenu;

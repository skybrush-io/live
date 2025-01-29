/**
 * @file Context menu using a Popover element that displays connands to send to the
 * currently selected UAVs.
 */

import { createSelector } from '@reduxjs/toolkit';
import { connect } from 'react-redux';

import MapContextMenu from '~/components/map/MapContextMenu';
import {
  cutFeature,
  showFeatureEditorDialog,
} from '~/features/map-features/actions';
import { getSelectedFeatures } from '~/features/map-features/selectors';
import {
  removeFeaturesByIds,
  updateFeatureAttributes,
} from '~/features/map-features/slice';
import { setFlatEarthCoordinateSystemOrigin } from '~/features/map/origin';
import { addNewWaypointMissionItem } from '~/features/mission/actions';
import { getGeofencePolygonId } from '~/features/mission/selectors';
import {
  clearGeofencePolygonId,
  setGeofencePolygonId,
} from '~/features/mission/slice';
import { updateOutdoorShowSettings } from '~/features/show/actions';
import { openFlyToTargetDialogWithCoordinate } from '~/features/uav-control/actions';
import { openUAVDetailsDialog } from '~/features/uavs/details';
import { getSelectedUAVIds } from '~/features/uavs/selectors';
import { hasFeature } from '~/utils/configuration';

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

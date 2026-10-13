import { getProposedIdForNewFeature } from '~/features/map-features/selectors';
import {
  addFeatureById,
  removeFeaturesByIds,
} from '~/features/map-features/slice';
import {
  getGeofencePolygonId,
  getMissionType,
} from '~/features/mission/selectors';
import { setGeofencePolygonId } from '~/features/mission/slice';
import { showError, showWarning } from '~/features/snackbar/actions';
import i18n from '~/i18n';
import { type Feature, FeatureType } from '~/model/features';
import { type AppDispatch, type AppThunk } from '~/store/reducers';
import { type LonLat } from '~/utils/geography';

import {
  getAutomaticGeofencePolygonForCurrentMissionType,
  isMapInSafeMode,
} from './selectors';

/**
 * Topic for notifications about blocked map edits, so that repeated attempts
 * replace the notification instead of stacking up new ones.
 */
const MAP_SAFE_MODE_NOTIFICATION_TOPIC = 'map-safe-mode';

/**
 * Thunk that dispatches the given actions only when the map is not in safe
 * mode; otherwise warns the user and dispatches nothing. The actions may be
 * plain action objects or thunks, so callers are free to compose conditional
 * or partial logic into a single thunk.
 */
export const updateMapSafely =
  (...actions: Array<Parameters<AppDispatch>[0]>): AppThunk =>
  (dispatch, getState) => {
    if (isMapInSafeMode(getState())) {
      showWarning(i18n.t('safety.mapSafeModeWarning'), {
        topic: MAP_SAFE_MODE_NOTIFICATION_TOPIC,
      });
      return;
    }

    for (const action of actions) {
      dispatch(action);
    }
  };

/**
 * Wraps an action creator so that it dispatches through `updateMapSafely`,
 * for use in `mapDispatchToProps` objects.
 */
export const guardedMapAction =
  <Args extends unknown[]>(
    action: (...args: Args) => Parameters<AppDispatch>[0]
  ) =>
  (...args: Args): AppThunk =>
    updateMapSafely(action(...args));

/**
 * Thunk that adds a geofence polygon with the given coordinates and owner.
 */
export const addGeofencePolygon =
  (points: LonLat[], owner: string): AppThunk =>
  (dispatch, getState) => {
    const state = getState();

    if (points.length < 3) {
      showError('Geofence to be added contains less than 3 points', {
        permanent: true,
      });
      return;
    }

    const geofencePolygon: Feature = {
      type: FeatureType.POLYGON,
      points,
    };
    const geofencePolygonId = getProposedIdForNewFeature(
      state,
      geofencePolygon
    );
    dispatch(
      addFeatureById({
        id: geofencePolygonId,
        feature: geofencePolygon,
        properties: { owner },
      })
    );
    dispatch(setGeofencePolygonId(geofencePolygonId));
  };

/**
 * Thunk that removes the current geofence polygon.
 */
export const removeGeofencePolygon = (): AppThunk => (dispatch, getState) => {
  const geofencePolygonId = getGeofencePolygonId(getState());
  if (geofencePolygonId !== undefined) {
    dispatch(removeFeaturesByIds([geofencePolygonId]));
  }
};

/**
 * Thunk that updates (adds if missing, replaces if present) the geofence
 * polygon based on the current mission type.
 */
export const updateGeofencePolygon = (): AppThunk => (dispatch, getState) => {
  const state = getState();
  const missionType = getMissionType(state);
  const geofencePolygon =
    getAutomaticGeofencePolygonForCurrentMissionType(state);

  geofencePolygon.match(
    (value) => {
      dispatch(removeGeofencePolygon());
      dispatch(addGeofencePolygon(value, missionType));
    },
    (error) => {
      showError(`Could not update geofence: ${error}`, { permanent: true });
    }
  );
};

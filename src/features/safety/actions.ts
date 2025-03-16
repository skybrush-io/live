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
import { showNotification } from '~/features/snackbar/actions';
import { MessageSemantics } from '~/features/snackbar/types';
import { type Feature, FeatureType } from '~/model/features';
import { type AppThunk } from '~/store/reducers';
import { type Coordinate2D } from '~/utils/math';

import { getAutomaticGeofencePolygonForCurrentMissionType } from './selectors';

/**
 * Thunk that adds a geofence polygon with the given coordinates and owner.
 */
export const addGeofencePolygon =
  (points: Coordinate2D[], owner: string): AppThunk =>
  (dispatch, getState) => {
    const state = getState();

    if (points.length < 3) {
      dispatch(
        showNotification({
          message: 'Geofence to be added contains less than 3 points',
          semantics: MessageSemantics.ERROR,
          permanent: true,
        })
      );
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
      dispatch(
        showNotification({
          message: `Could not update geofence: ${error}`,
          semantics: MessageSemantics.ERROR,
          permanent: true,
        })
      );
    }
  );
};

/**
 * Module containing code related to connecting OpenLayers features with our
 * model objects and converting between the two.
 */

import isEmpty from 'lodash-es/isEmpty';
import isNil from 'lodash-es/isNil';
import unary from 'lodash-es/unary';

import { updateFlatEarthCoordinateSystem } from '~/features/map/origin';
import { cloneFeatureById } from '~/features/map-features/actions';
import { updateFeaturePropertiesByIds } from '~/features/map-features/slice';
import { moveMissionItemCoordinateByMapCoordinateDelta } from '~/features/mission/actions';
import {
  moveOutdoorShowOriginByMapCoordinateDelta,
  rotateOutdoorShowOrientationByAngleAroundPoint,
} from '~/features/show/actions';
import {
  lonLatFromMapViewCoordinate,
  normalizePolygon,
} from '~/utils/geography';
import { toDegrees } from '~/utils/math';

import { FeatureType } from './features';
import {
  globalIdToAreaId,
  globalIdToFeatureId,
  globalIdToOriginId,
  isAreaId,
  isFeatureId,
  isOriginId,
  MAP_ORIGIN_ID,
  CONVEX_HULL_AREA_ID,
  globalIdToMissionItemId,
  isMissionItemId,
} from './identifiers';

/**
 * Returns whether the given OpenLayers feature is transformable with a
 * standard transformation interaction.
 *
 * @param  {ol.Feature|null|undefined}  obj  the feature to test
 * @return {boolean} whether the feature is transformable
 */
export function isFeatureTransformable(object) {
  if (isNil(object)) {
    return false;
  }

  const id = object.getId();
  return (
    isFeatureId(id) || isAreaId(id) || isOriginId(id) || isMissionItemId(id)
  );
}

/**
 * Converts an OpenLayers geometry object into a list of corresponding feature
 * objects that can be stored in the global state store.
 *
 * @param  {ol.Geometry} olGeometry - the OpenLayers geometry
 * @return {Object} the list of features to store in the global state
 */
export function createFeatureFromOpenLayersGeometry(olGeometry) {
  const type = olGeometry.getType();
  const coordinates = olGeometry.getCoordinates();

  switch (type) {
    case 'Point':
      return [
        {
          type: FeatureType.POINTS,
          filled: false,
          points: [lonLatFromMapViewCoordinate(coordinates)],
        },
      ];

    case 'Circle': {
      const center = olGeometry.getCenter();
      return [
        {
          type: FeatureType.CIRCLE,
          points: [
            lonLatFromMapViewCoordinate(center),
            lonLatFromMapViewCoordinate([
              center[0] + olGeometry.getRadius(),
              center[1],
            ]),
          ],
        },
      ];
    }

    case 'LineString':
      return [
        {
          type: FeatureType.LINE_STRING,
          filled: false,
          points: coordinates.map(unary(lonLatFromMapViewCoordinate)),
        },
      ];

    case 'Polygon': {
      return (
        // Normalize the polygon by correcting overlapping or external holes
        normalizePolygon(
          // Convert between coordinate representations
          coordinates.map((linearRing) =>
            linearRing.map(unary(lonLatFromMapViewCoordinate))
          )
        )
          // "Open" the rings by removing their redundant last elements
          .map((coordinates) =>
            coordinates.map((linearRing) => linearRing.slice(0, -1))
          )
          // Turn the lists of linear rings into internal features
          .map(([points, ...holes]) => ({
            type: FeatureType.POLYGON,
            points,
            holes,
          }))
      );
    }

    case 'MultiPolygon': {
      return olGeometry
        .getPolygons()
        .flatMap(createFeatureFromOpenLayersGeometry);
    }

    default:
      throw new Error('Unsupported feature geometry type: ' + type);
  }
}

/**
 * Converts an OpenLayers feature object into a list of corresponding feature
 * objects that can be stored in the global state store.
 *
 * @param  {ol.Feature} olFeature - the OpenLayers feature
 * @return {Object} the list of features to store in the global state
 */
export function createFeatureFromOpenLayers(olFeature) {
  return createFeatureFromOpenLayersGeometry(olFeature.getGeometry());
}

/**
 * Handles the cases when some of the features are updated in OpenLayers and
 * propagates the updates back to the Redux store.
 *
 * This function must be called whenever OpenLayers indicates (via events) that
 * some of the features were modified.
 *
 * @param  {Array<ol.Feature>}  features  the array of features that were updated
 * @param  {function}  dispatch  the Redux store dispatcher function
 * @param  {string}  type  the type of the modification; may be one of 'modify'
 *         (general modification of the feature, including adding / removing / updating
 *         individual vertices) or 'transform" (moving or rotating the entire
 *         feature)
 */
export function handleFeatureUpdatesInOpenLayers(
  features,
  dispatch,
  { event, type } = {}
) {
  const updatedUserFeatures = {};

  for (const feature of features) {
    const globalId = feature.getId();

    // Is this feature a user-defined feature? If so, we update it directly
    // in the Redux store.
    const userFeatureId = globalIdToFeatureId(globalId);
    if (userFeatureId) {
      // Feature is a user-defined feature so update it in the Redux store
      const [updatedFeature, ...newFeatures] =
        createFeatureFromOpenLayers(feature);
      updatedUserFeatures[userFeatureId] = updatedFeature;

      newFeatures.forEach((nf) => {
        dispatch(cloneFeatureById(userFeatureId, nf));
      });

      continue;
    }

    // Does this feature represent the origin of a coordinate system?
    const originFeatureId = globalIdToOriginId(globalId);
    if (originFeatureId) {
      if (
        originFeatureId === MAP_ORIGIN_ID + '$x' ||
        originFeatureId === MAP_ORIGIN_ID + '$y'
      ) {
        // Feature is the origin of the flat Earth coordinate system
        const [featureObject] = createFeatureFromOpenLayers(feature);
        const isYAxis = originFeatureId === MAP_ORIGIN_ID + '$y';
        const coords = feature.getGeometry().getCoordinates();
        const position = featureObject.points[0];
        let angle =
          90 -
          toDegrees(
            Math.atan2(
              // Don't use featureObject.points here because they are already
              // in lat-lon so they cannot be used to calculate an angle
              coords[1][1] - coords[0][1],
              coords[1][0] - coords[0][0]
            )
          );

        if (isYAxis) {
          angle += 90;
        }

        dispatch(updateFlatEarthCoordinateSystem({ position, angle }));
      } else {
        // Some other origin (e.g., show origin). We don't handle it yet,
        // maybe later?
      }

      continue;
    }

    // Is this feature an area such as the convex hull of the show?
    const areaId = globalIdToAreaId(globalId);
    if (areaId === CONVEX_HULL_AREA_ID) {
      if (type === 'transform') {
        if (event.subType === 'move' && event.delta) {
          dispatch(moveOutdoorShowOriginByMapCoordinateDelta(event.delta));
        } else if (
          event.subType === 'rotate' &&
          event.angleDelta &&
          event.origin
        ) {
          dispatch(
            rotateOutdoorShowOrientationByAngleAroundPoint(
              toDegrees(-event.angleDelta),
              event.origin
            )
          );
        }
      } else {
        console.warn(
          'This transformation is not handled for the convex hull yet'
        );
      }

      continue;
    }

    // Is this feature a waypoint mission item?
    const missionItemId = globalIdToMissionItemId(globalId);
    if (missionItemId) {
      if (type === 'transform') {
        if (event.subType === 'move' && event.delta) {
          dispatch(
            moveMissionItemCoordinateByMapCoordinateDelta(
              missionItemId,
              event.delta
            )
          );
        }
      } else {
        console.warn(
          'This transformation is not handled for waypoint mission items yet'
        );
      }
    }
  }

  if (!isEmpty(updatedUserFeatures)) {
    dispatch(updateFeaturePropertiesByIds(updatedUserFeatures));
  }
}

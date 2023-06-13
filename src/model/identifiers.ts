import { appendTo, hasPrefix, stripPrefix } from '~/utils/operators';

export const areaIdToGlobalId = appendTo('area$');
export const beaconIdToGlobalId = appendTo('beacon$');
export const dockIdToGlobalId = appendTo('dock$');
export const featureIdToGlobalId = appendTo('feature$');
export const homePositionIdToGlobalId = appendTo('home$');
export const landingPositionIdToGlobalId = appendTo('land$');
export const originIdToGlobalId = appendTo('origin$');
export const plannedTrajectoryIdToGlobalId = appendTo('planned$');
export const uavIdToGlobalId = appendTo('uav$');
export const missionSlotIdToGlobalId = appendTo('mission$');

export const globalIdToAreaId = stripPrefix('area$');
export const globalIdToBeaconId = stripPrefix('beacon$');
export const globalIdToDockId = stripPrefix('dock$');
export const globalIdToFeatureId = stripPrefix('feature$');
export const globalIdToHomePositionId = stripPrefix('home$');
export const globalIdToLandingPositionId = stripPrefix('land$');
export const globalIdToOriginId = stripPrefix('origin$');
export const globalIdToPlannedTrajectoryId = stripPrefix('planned$');
export const globalIdToUavId = stripPrefix('uav$');
export const globalIdToMissionSlotId = stripPrefix('mission$');

export const isAreaId = hasPrefix('area$');
export const isBeaconId = hasPrefix('beacon$');
export const isDockId = hasPrefix('dock$');
export const isFeatureId = hasPrefix('feature$');
export const isHomePositionId = hasPrefix('home$');
export const isLandingPositionId = hasPrefix('land$');
export const isOriginId = hasPrefix('origin$');
export const isPlannedTrajectoryId = hasPrefix('planned$');
export const isUavId = hasPrefix('uav$');
export const isMissionIndex = hasPrefix('mission$');

export const MAP_ORIGIN_ID = 'map';
export const MISSION_ORIGIN_ID = 'mission';
export const CONVEX_HULL_AREA_ID = 'convexHull';

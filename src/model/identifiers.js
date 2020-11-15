import { appendTo, hasPrefix, stripPrefix } from '~/utils/operators';

export const areaIdToGlobalId = appendTo('area$');
export const dockIdToGlobalId = appendTo('dock$');
export const featureIdToGlobalId = appendTo('feature$');
export const homePositionIdToGlobalId = appendTo('home$');
export const landingPositionIdToGlobalId = appendTo('land$');
export const originIdToGlobalId = appendTo('origin$');
export const uavIdToGlobalId = appendTo('uav$');

export const globalIdToAreaId = stripPrefix('area$');
export const globalIdToDockId = stripPrefix('dock$');
export const globalIdToFeatureId = stripPrefix('feature$');
export const globalIdToHomePositionId = stripPrefix('home$');
export const globalIdToLandingPositionId = stripPrefix('land$');
export const globalIdToOriginId = stripPrefix('origin$');
export const globalIdToUavId = stripPrefix('uav$');

export const isAreaId = hasPrefix('area$');
export const isDockId = hasPrefix('dock$');
export const isFeatureId = hasPrefix('feature$');
export const isHomePositionId = hasPrefix('home$');
export const isLandingPositionId = hasPrefix('land$');
export const isOriginId = hasPrefix('origin$');
export const isUavId = hasPrefix('uav$');

export const MAP_ORIGIN_ID = 'map';
export const MISSION_ORIGIN_ID = 'mission';
export const CONVEX_HULL_AREA_ID = 'convexHull';

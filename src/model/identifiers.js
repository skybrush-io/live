import { appendTo, stripPrefix } from '../utils/operators';

export const dockIdToGlobalId = appendTo('dock$');
export const featureIdToGlobalId = appendTo('feature$');
export const homePositionIdToGlobalId = appendTo('home$');
export const landingPositionIdToGlobalId = appendTo('land$');
export const originIdToGlobalId = appendTo('origin$');
export const uavIdToGlobalId = appendTo('uav$');

export const globalIdToDockId = stripPrefix('dock$');
export const globalIdToFeatureId = stripPrefix('feature$');
export const globalIdToHomePositionId = stripPrefix('home$');
export const globalIdToLandingPositionId = stripPrefix('land$');
export const globalIdToOriginId = stripPrefix('origin$');
export const globalIdToUavId = stripPrefix('uav$');

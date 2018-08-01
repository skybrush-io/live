import { appendTo, stripPrefix } from '../utils/operators'

export const featureIdToGlobalId = appendTo('feature$')
export const homePositionIdToGlobalId = appendTo('home$')
export const uavIdToGlobalId = appendTo('uav$')

export const globalIdToFeatureId = stripPrefix('feature$')
export const globalIdToHomePositionId = stripPrefix('home$')
export const globalIdToUavId = stripPrefix('uav$')

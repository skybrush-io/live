import { appendTo, stripPrefix } from '../utils/operators'

export const featureIdToGlobalId = appendTo('feature$')
export const globalIdToFeatureId = stripPrefix('feature$')
export const uavIdToGlobalId = appendTo('uav$')
export const globalIdToUavId = stripPrefix('uav$')

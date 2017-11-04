import { appendTo, stripPrefix } from '../utils/operators'

export const uavIdToFeatureId = appendTo('uav$')
export const featureIdToUavId = stripPrefix('uav$')

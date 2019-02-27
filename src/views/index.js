/**
 * @file File that re-exports all the individual views implemented in
 * other files in this folder.
 */

import ClockDisplayList from './clocks'
import ConnectionList from './connections'
import DatasetList from './datasets'
import FeatureList from './features'
import GroundControlView from './groundcontrol'
import LayerList from './layers'
import MapView from './map'
import SavedLocationList from './locations'
import LogPanel from './log'
import UAVList from './uavs'

export default {
  ClockDisplayList,
  ConnectionList,
  DatasetList,
  FeatureList,
  GroundControlView,
  LayerList,
  LogPanel,
  MapView,
  SavedLocationList,
  UAVList
}

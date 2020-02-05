/**
 * @file File that re-exports all the individual views implemented in
 * other files in this folder.
 */

import ClockDisplayList from './clocks';
import ConnectionList from './connections';
import DatasetList from './datasets';
import DockList from './docks';
import FeatureList from './features';
import LayerList from './layers';
import LCDClockPanel from './lcd-clock';
import SavedLocationList from './locations';
import LogPanel from './log';
import MapView from './map';
import ShowControlPanel from './show-control';
import UAVList from './uavs';

export default {
  ClockDisplayList,
  ConnectionList,
  DatasetList,
  DockList,
  FeatureList,
  LayerList,
  LCDClockPanel,
  LogPanel,
  MapView,
  SavedLocationList,
  ShowControlPanel,
  UAVList
};

/**
 * @file File that re-exports all the individual views implemented in
 * other files in this folder.
 */

import BeaconList from './beacons';
import ClockDisplayList from './clocks';
import ConnectionList from './connections';
import DatasetList from './datasets';
import DockList from './docks';
import FeaturePanel from './features';
import LayerList from './layers';
import LCDClockPanel from './lcd-clock';
import LightControlPanel from './light-control';
import SavedLocationList from './locations';
import LogPanel from './log';
import MessagesPanelView from './messages';
import MissionOverviewPanel from './mission-editor';
import ShowControlPanel from './show-control';
import UAVDetailsPanel from './uav-details';
import UAVList from './uavs';
import UAVStatusPanel from './uavs/UAVStatusPanel';
import ThreeDTopLevelView from './three-d';

/* MapView not included as it is loaded lazily */

const views = {
  BeaconList,
  ClockDisplayList,
  ConnectionList,
  DatasetList,
  DockList,
  FeaturePanel,
  LayerList,
  LCDClockPanel,
  LightControlPanel,
  LogPanel,
  MessagesPanelView,
  MissionOverviewPanel,
  SavedLocationList,
  ShowControlPanel,
  UAVDetailsPanel,
  UAVList,
  ThreeDTopLevelView,
  UAVStatusPanel,
};

export default views;

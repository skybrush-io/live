/**
 * @file File that re-exports all the individual views implemented in
 * other files in this folder.
 */

import BeaconList from './beacons';
import ClockDisplayList from './clocks';
import ConnectionList from './connections';
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
import ThreeDTopLevelView from './three-d';
import TimelineView from './timeline';
import UAVDetailsPanel from './uav-details';
import UAVList from './uavs';

/* MapView not included as it is loaded lazily */

const views = {
  BeaconList,
  ClockDisplayList,
  ConnectionList,
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
  TimelineView,
};

export default views;

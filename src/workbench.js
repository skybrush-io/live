/**
 * @file The main workbench object of the application that allows users
 * to arrange views in a flexible manner.
 *
 * This file contains a singleton instance of the workbench that is then
 * imported by the app. The app then binds the workbench to the central
 * workbench view and the sidebar.
 */

import debounce from 'lodash-es/debounce';
import React from 'react';
import { WorkbenchBuilder } from 'react-flexible-workbench';

import loadable from '@loadable/component';
import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';

import { saveWorkbenchState } from './features/workbench/slice';
import { injectFlockFromContext } from './flock';
import store from './store';
import { hasFeature } from './utils/configuration';
import views from './views';

const MapView = loadable(() =>
  import(/* webpackChunkName: "map" */ './views/map/MapView')
);

require('../assets/css/workbench.less');

/**
 * Dummy component that renders nothing.
 */
const Nothing = () => null;

/**
 * Fallback component to use in the workbench in case of errors.
 */
const FallbackComponent = () => (
  <BackgroundHint text='This component is not available in this version' />
);

/**
 * Helper function that returns the given value if and only if the given
 * feature is present in the configuration.
 */
const onlyWithFeature = (featureName, component) =>
  hasFeature(featureName) ? component : FallbackComponent;

/**
 * Registry that maps component types to be used in the top-level
 * GoldenLayout object to the corresponding React components.
 *
 * The React components will be created without any props. If you need the
 * components to have props, use a wrapper HOC.
 */
const componentRegistry = {
  'connection-list': views.ConnectionList,
  'dataset-list': views.DatasetList,
  'dock-list': onlyWithFeature('docks', views.DockList),
  'feature-list': onlyWithFeature('features', views.FeatureList),
  'ground-control-view': injectFlockFromContext(views.GroundControlView),
  'layer-list': views.LayerList,
  'light-control': onlyWithFeature('showControl', views.LightControlPanel),
  'lcd-clock-panel': views.LCDClockPanel,
  'log-panel': views.LogPanel,
  map: MapView,
  messages: views.MessagesPanelView, // deprecated, kept there for compatibility
  placeholder: Nothing,
  'saved-location-list': views.SavedLocationList,
  'show-control': onlyWithFeature('showControl', views.ShowControlPanel),
  'three-d-view': onlyWithFeature('threeDView', views.ThreeDTopLevelView),
  'uav-list': injectFlockFromContext(views.UAVList),
};

function constructDefaultWorkbench(store) {
  const builder = new WorkbenchBuilder();

  // Register all our supported components in the builder
  for (const key of Object.keys(componentRegistry)) {
    builder.registerComponent(key, componentRegistry[key]);
  }

  // prettier-ignore
  const workbench = builder
    .makeColumns()
      .makeStack()
        .add('map')
          .setTitle('Map')
          .setId('map')
        .add('uav-list')
          .setTitle('UAVs')
          .setId('uavs')
        .add('three-d-view')
          .setTitle('3D View')
          .setId('threeDView')
          .preventReorder()
        .finish()
      .makeRows()
        .makeStack()
          .add('lcd-clock-panel')
            .setTitle('Clocks')
            .setId('clocks')
          .add('saved-location-list')
            .setTitle('Locations')
            .setId('locations')
          .add('layer-list')
            .setTitle('Layers')
            .setId('layers')
          .finish()
          .setRelativeHeight(25)
        .makeStack()
          .add('show-control')
            .setTitle('Show control')
            .setId('show')
          .add('light-control')
            .setTitle('Light control')
            .setId('lights')
          .finish()
        .finish()
        .setRelativeWidth(25)
      .finish()
    .build();

  // Set a fallback component for cases when we cannot show a component
  workbench.fallback = FallbackComponent;

  // Wire the workbench to the store so the store is updated when
  // the workbench state changes
  workbench.on(
    'stateChanged',
    debounce(() => {
      store.dispatch(saveWorkbenchState(workbench));
    }, 1000)
  );

  return workbench;
}

const workbench = constructDefaultWorkbench(store);

/**
 * React context that exposes the workbench instance to components.
 */
export const Workbench = React.createContext(workbench);

export default workbench;

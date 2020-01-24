/**
 * @file The main workbench object of the application that allows users
 * to arrange views in a flexible manner.
 *
 * This file contains a singleton instance of the workbench that is then
 * imported by the app. The app then binds the workbench to the central
 * workbench view and the sidebar.
 */

import React from 'react';
import { WorkbenchBuilder } from 'react-flexible-workbench';
import compose from 'recompose/compose';
import renderNothing from 'recompose/renderNothing';
import withProps from 'recompose/withProps';

import MessagesPanel from './components/chat/MessagesPanel';
import { saveWorkbenchState } from './features/workbench/slice';
import { Flock } from './flock';
import store from './store';
import views from './views';

require('../assets/css/workbench.less');

/**
 * Higher order component that propagates the flock passed in the context
 * as props into the wrapped component.
 */
const injectFlockFromContext = BaseComponent =>
  React.forwardRef((props, ref) => (
    <Flock.Consumer>
      {flock => <BaseComponent {...props} ref={ref} flock={flock} />}
    </Flock.Consumer>
  ));

/**
 * Registry that maps component types to be used in the top-level
 * GoldenLayout object to the corresponding React components.
 *
 * The React components will be created without any props. If you need the
 * components to have props, use the <code>withProps()</code> helper function
 * from <code>recompose</code>.
 */
const componentRegistry = {
  'connection-list': views.ConnectionList,
  'clock-list': views.ClockDisplayList,
  'dataset-list': views.DatasetList,
  'dock-list': views.DockList,
  'feature-list': views.FeatureList,
  'ground-control-view': injectFlockFromContext(views.GroundControlView),
  'layer-list': views.LayerList,
  'log-panel': views.LogPanel,
  configuration: injectFlockFromContext(views.DroneShowConfigurationView),
  map: views.MapView,
  messages: compose(
    withProps({
      style: {
        padding: '0 10px'
      }
    }),
    injectFlockFromContext
  )(MessagesPanel),
  placeholder: renderNothing(),
  'saved-location-list': views.SavedLocationList,
  'uav-list': injectFlockFromContext(views.UAVList)
};

function constructDefaultWorkbench(store) {
  const builder = new WorkbenchBuilder();

  // Register all our supported components in the builder
  for (const key of Object.keys(componentRegistry)) {
    builder.registerComponent(key, componentRegistry[key]);
  }

  const workbench = builder
    .makeColumns()
    .makeStack()
    .add('map')
    .setTitle('Map')
    .setId('map')
    .finish()
    .makeRows()
    .makeStack()
    .add('saved-location-list')
    .setTitle('Locations')
    .setId('locations')
    .add('layer-list')
    .setTitle('Layers')
    .setId('layers')
    .finish()
    .setRelativeHeight(25)
    .makeStack()
    .add('uav-list')
    .setTitle('UAVs')
    .setId('uavs')
    .add('dock-list')
    .setTitle('Docks')
    .setId('docks')
    .add('messages')
    .setTitle('Messages')
    .setId('messages')
    .finish()
    .finish()
    .setRelativeWidth(25)
    .finish()
    .build();

  // Wire the workbench to the store so the store is updated when
  // the workbench state changes
  workbench.on('stateChanged', () => {
    store.dispatch(saveWorkbenchState(workbench));
  });

  return workbench;
}

const workbench = constructDefaultWorkbench(store);

export default workbench;

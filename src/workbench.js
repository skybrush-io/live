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

import { makeDetachable } from './features/detachable-panels/DetachablePanel';
import { createPerspectiveBuilder } from './features/perspectives/utils';
import {
  saveWorkbenchState,
  setWorkbenchHasHeaders,
  setWorkbenchIsFixed,
} from './features/workbench/slice';
import { injectFlockFromContext } from './flock';
import i18n from './i18n';
import store from './store';
import {
  getDefaultWorkbenchPerspectiveSpecification,
  hasFeature,
} from './utils/configuration';
import views from './views';

const FieldNotesPanel = loadable(
  () =>
    import(
      /* webpackChunkName: "field-notes" */ './views/field-notes/FieldNotesPanel'
    )
);

const MapView = loadable(
  () => import(/* webpackChunkName: "map" */ './views/map/MapView')
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

export const componentRegistry = {
  'beacon-list': {
    component: views.BeaconList,
    label: 'Beacons',
    detachable: true,
    feature: 'beacons',
  },
  'connection-list': {
    // deprecated, kept there for compatibility
    component: views.ConnectionList,
    label: 'Connections',
  },
  'dataset-list': {
    component: views.DatasetList,
    label: 'Datasets',
    detachable: true,
  },
  'dock-list': {
    component: views.DockList,
    label: 'Docks',
    detachable: true,
    feature: 'docks',
  },
  'feature-list': {
    component: views.FeatureList,
    label: 'Features',
    detachable: true,
    feature: 'features',
  },
  'field-notes': {
    component: FieldNotesPanel,
    label: 'Field notes',
  },
  'ground-control-view': {
    component: injectFlockFromContext(views.GroundControlView),
    label: 'Ground control',
  },
  'layer-list': {
    component: views.LayerList,
    label: 'Layers',
    detachable: true,
  },
  'light-control': {
    component: views.LightControlPanel,
    label: 'Light control',
    detachable: true,
    feature: 'showControl',
  },
  'lcd-clock-panel': {
    component: views.LCDClockPanel,
    label: 'Clocks',
    detachable: true,
  },
  'log-panel': {
    component: views.LogPanel,
    label: 'Event log',
    detachable: true,
  },
  map: {
    component: MapView,
    label: 'Map',
    detachable: true,
  },
  messages: {
    // deprecated, kept there for compatibility
    component: views.MessagesPanelView,
    label: 'Messages',
  },
  placeholder: {
    component: Nothing,
    label: 'Placeholder',
  },
  'saved-location-list': {
    component: views.SavedLocationList,
    label: 'Locations',
    detachable: true,
  },
  'show-control': {
    component: views.ShowControlPanel,
    label: 'Show control',
    detachable: true,
    feature: 'showControl',
  },
  'three-d-view': {
    component: views.ThreeDTopLevelView,
    label: '3D View',
    feature: 'threeDView',
  },
  'uav-list': {
    component: injectFlockFromContext(views.UAVList),
    label: 'UAVs',
    detachable: true,
  },
};

function constructDefaultWorkbench(store) {
  const workbenchBuilder = new WorkbenchBuilder();

  // Register all our supported components in the workbench builder
  for (const [name, entry] of Object.entries(componentRegistry)) {
    const featureModifier = (c) =>
      entry.feature ? onlyWithFeature(entry.feature, c) : c;
    const detachModifier = (c) =>
      entry.detachable ? makeDetachable(name, entry.label, c) : c;
    workbenchBuilder.registerComponent(
      name,
      featureModifier(detachModifier(entry.component))
    );
  }

  // Create the default perspective
  const workbench = workbenchBuilder.build();
  const { isFixed, state } = createPerspectiveBuilder(
    componentRegistry,
    workbench
  )(getDefaultWorkbenchPerspectiveSpecification());

  workbench.restoreState(state);
  store.dispatch(setWorkbenchHasHeaders(state.settings.hasHeaders));
  store.dispatch(setWorkbenchIsFixed(isFixed));

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

i18n.on('languageChanged', () => {
  workbench.forEach((view) => {
    if (view.isComponent) {
      /* i18next-extract-disable-next-line */
      view.setTitle(i18n.t(`view.${view.config.component}`));
    }
  });
});

/**
 * React context that exposes the workbench instance to components.
 */
export const Workbench = React.createContext(workbench);

export default workbench;

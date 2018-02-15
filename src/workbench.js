/**
 * @file The main workbench object of the application that allows users
 * to arrange views in a flexible manner.
 *
 * This file contains a singleton instance of the workbench that is then
 * imported by the app. The app then binds the workbench to the central
 * workbench view and the sidebar.
 */

import PropTypes from 'prop-types'
import { WorkbenchBuilder } from 'react-flexible-workbench'
import { compose, getContext, renderNothing, withProps } from 'recompose'

import ClockDisplayList from './components/ClockDisplayList'
import ConnectionList from './components/ConnectionList'
import LayerList from './components/LayerList'
import LogPanel from './components/LogPanel'
import SavedLocationList from './components/SavedLocationList'
import UAVList from './components/UAVList'
import MessagesPanel from './components/chat/MessagesPanel'
import MapView from './components/map/MapView'

import { saveWorkbenchState } from './actions/workbench'
import store from './store'

require('../assets/css/workbench.less')

/**
 * Higher order component that propagates the flock passed in the context
 * as props into the wrapped component.
 */
const getFlockFromContext = getContext({
  flock: PropTypes.object.isRequired
})

/**
 * Registry that maps component types to be used in the top-level
 * GoldenLayout object to the corresponding React components.
 *
 * The React components will be created without any props. If you need the
 * components to have props, use the <code>getContext()</code> or
 * <code>withProps()</code> helper functions from <code>recompose</code>.
 */
const componentRegistry = {
  'connection-list': ConnectionList,
  'clock-list': ClockDisplayList,
  'layer-list': LayerList,
  'saved-location-list': SavedLocationList,
  'log-panel': LogPanel,
  'map': MapView,
  'messages': compose(withProps({
    style: {
      padding: '0 10px'
    }
  }), getFlockFromContext)(MessagesPanel),
  'placeholder': renderNothing(),
  'uav-list': getFlockFromContext(UAVList)
}

function constructDefaultWorkbench (store) {
  const builder = new WorkbenchBuilder()

  // Register all our supported components in the builder
  for (const key in componentRegistry) {
    builder.registerComponent(key, componentRegistry[key])
  }

  /* eslint-disable indent */
  const workbench = builder
    .makeColumns()
      .makeStack()
        .add(MapView).setTitle('Map').setId('map')
      .finish()
      .makeRows()
        .makeStack()
          .add(SavedLocationList).setTitle('Locations').setId('locations')
          .add(LayerList).setTitle('layers').setId('Layers')
        .finish()
        .setRelativeHeight(25)
        .makeStack()
          .add('uav-list').setTitle('UAVs').setId('uavs')
          .add('messages').setTitle('Messages').setId('messages')
        .finish()
      .finish()
      .setRelativeWidth(25)
    .finish()
    .build()
  /* eslint-enable indent */

  // Wire the workbench to the store so the store is updated when
  // the workbench state changes
  workbench.on('stateChanged', () => {
    store.dispatch(saveWorkbenchState(workbench))
  })

  return workbench
}

const workbench = constructDefaultWorkbench(store)

export default workbench

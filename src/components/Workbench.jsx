/**
 * @file The main workbench component of the application that allows users
 * to arrange views in a flexible manner.
 *
 * Most of the functionality of this class is provided by the excellent
 * <code>golden-layout</code> library - we only wrap it in a React
 * component for sake of convenience.
 */

import PropTypes from 'prop-types'
import React from 'react'
import { WorkbenchBuilder, WorkbenchView } from 'react-flexible-workbench'
import { compose, getContext, renderNothing, withProps } from 'recompose'

import ClockDisplayList from './ClockDisplayList'
import ConnectionList from './ConnectionList'
import SavedLocationList from './SavedLocationList'
import MessagesPanel from './chat/MessagesPanel'
import UAVList from './UAVList'
import MapView from './map/MapView'

require('../../assets/css/workbench.less')

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
  'saved-location-list': SavedLocationList,
  'map': MapView,
  'messages': compose(withProps({
    style: {
      padding: '0 10px'
    }
  }), getFlockFromContext)(MessagesPanel),
  'placeholder': renderNothing(),
  'uav-list': getFlockFromContext(UAVList)
}

/**
 * The top-level workbench class.
 */
export default class Workbench extends React.Component {
  constructor (props) {
    super(props)

    this.workbench = this.constructLayout()
    this.workbench.contextProvider = this.getContextForComponent.bind(this)
  }

  constructLayout () {
    const builder = new WorkbenchBuilder()
    for (const key in componentRegistry) {
      builder.registerComponent(key, componentRegistry[key])
    }
    /* eslint-disable indent */
    return builder
      .makeColumns()
        .add(MapView).setTitle('Map')
        .makeRows()
          .makeStack()
            .add(ConnectionList).setTitle('Connections')
            .add(ClockDisplayList).setTitle('Clocks')
            .add(SavedLocationList).setTitle('Locations')
          .finish()
          .setRelativeHeight(25)
          .makeStack()
            .add('uav-list').setTitle('UAVs')
            .add('messages').setTitle('Messages')
          .finish()
        .finish()
        .setRelativeWidth(25)
      .finish()
      .build()
    /* eslint-enable indent */
  }

  getContextForComponent (component) {
    const { flock, muiTheme, store } = this.context
    return {
      childContextTypes: {
        flock: PropTypes.object.isRequired,
        muiTheme: PropTypes.object.isRequired,
        store: PropTypes.object.isRequired
      },
      getChildContext: () => ({
        flock, muiTheme, store
      })
    }
  }

  render () {
    return (
      <WorkbenchView workbench={this.workbench} />
    )
  }
}

Workbench.contextTypes = {
  flock: PropTypes.object.isRequired,
  muiTheme: PropTypes.object.isRequired,
  store: PropTypes.object.isRequired
}

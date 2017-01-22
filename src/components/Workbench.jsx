/**
 * @file The main workbench component of the application that allows users
 * to arrange views in a flexible manner.
 *
 * Most of the functionality of this class is provided by the excellent
 * <code>golden-layout</code> library - we only wrap it in a React
 * component for sake of convenience.
 */

import GoldenLayout from 'golden-layout'
import React, { PropTypes } from 'react'
import { findDOMNode } from 'react-dom'
import { getContext, renderNothing, withContext } from 'recompose'

import ClockDisplayList from './ClockDisplayList'
import ConnectionList from './ConnectionList'
import UAVList from './UAVList'
import MapView from './map/MapView'

require('../../assets/css/workbench.less')

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
  'map': MapView,
  'placeholder': renderNothing(),
  'uav-list': getContext({
    flock: PropTypes.object.isRequired
  })(UAVList)
}

/**
 * Registers all the known React components that we support as top-level
 * components in the workbench into the given layout.
 *
 * Internally, each component that we support is wrapped in a wrapper
 * component that provides the <code>store</code> and <code>muiTheme</code>
 * properties for the wrapped component as part of the React context. This
 * is needed because GoldenLayout does not allow us to pass through the React
 * context directly.
 *
 * @param {GoldenLayout} layout   the layout object
 * @param {Object} flock  the UAV flock to pass down to each top-level
 *        comopnent in the layout
 * @param {Object} store  the Redux store to pass down to each top-level
 *        comopnent in the layout
 */
function registerComponentsInLayout (layout, { flock, muiTheme, store }) {
  const wrapComponent = withContext({
    flock: PropTypes.object.isRequired,
    muiTheme: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired
  }, props => ({ flock, store, muiTheme }))
  for (const key in componentRegistry) {
    layout.registerComponent(key, wrapComponent(componentRegistry[key]))
  }
}

export default class Workbench extends React.Component {
  componentDidMount () {
    const config = this.getDefaultConfig()

    this.layout = new GoldenLayout(config)
    registerComponentsInLayout(this.layout, this.context)

    this.layout.container = findDOMNode(this)
    this.layout.init()
  }

  componentWillUnmount () {
    this.layout.destroy()
  }

  getDefaultConfig () {
    return {
      content: [{
        type: 'row',
        content: [
          {
            type: 'react-component',
            component: 'map',
            title: 'Map'
          },
          {
            type: 'column',
            width: 25,
            content: [
              {
                type: 'stack',
                height: 25,
                content: [
                  {
                    type: 'react-component',
                    component: 'connection-list',
                    title: 'Connections'
                  },
                  {
                    type: 'react-component',
                    component: 'clock-list',
                    title: 'Clocks'
                  }
                ]
              },
              {
                type: 'react-component',
                component: 'uav-list',
                title: 'UAVs'
              }
            ]
          }
        ]
      }],
      settings: {
        showPopoutIcon: false
      }
    }
  }

  render () {
    return <div id="workbench"></div>
  }
}

Workbench.contextTypes = {
  flock: PropTypes.object.isRequired,
  muiTheme: PropTypes.object.isRequired,
  store: PropTypes.object.isRequired
}

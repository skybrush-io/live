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
import { WindowResizeListener } from 'react-window-resize-listener'
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

/**
 * Extends the behaviour of the golden-layout stacks such that they unmount
 * any React components from the DOM that are not on a visible tab.
 *
 * @param {GoldenLayout} layout   the layout object
 */
function makeStacksUnmountInvisibleComponents (layout) {
  layout.on('stackCreated', stack => {
    let previousComponent

    stack.on('activeContentItemChanged', item => {
      previousComponent = item
    })
  })
}

/*
 * Extracts the React component instance from the given golden-layout
 * content item.
 *
 * @param  {Object} contentItem  the content item to extract the component from
 * @return {React.Component} the React component instance that is currently
 *         shown in the content item
 */
/*
function getReactComponentFromContentItem (contentItem) {
  const instance = contentItem.instance
  return instance ? instance._reactComponent : undefined
}
*/

/**
 * The top-level workbench class.
 */
export default class Workbench extends React.Component {
  constructor (props) {
    super(props)
    this.onResize = this.onResize.bind(this)
  }

  componentDidMount () {
    const config = this.getDefaultConfig()

    this.layout = new GoldenLayout(config)
    registerComponentsInLayout(this.layout, this.context)
    makeStacksUnmountInvisibleComponents(this.layout)

    this.layout.container = findDOMNode(this)
    this.layout.init()
  }

  componentWillUnmount () {
    this.layout.destroy()
    delete this.layout
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
                // type: 'component',
                // componentName: 'lm-react-component',
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

  onResize () {
    if (this.layout && this.layout.container && this.layout.container.width) {
      this.layout.updateSize()
    }
  }

  render () {
    return (
      <div id="workbench">
        <WindowResizeListener onResize={this.onResize} />
      </div>
    )
  }
}

Workbench.contextTypes = {
  flock: PropTypes.object.isRequired,
  muiTheme: PropTypes.object.isRequired,
  store: PropTypes.object.isRequired
}

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
import { findDOMNode, render, unmountComponentAtNode } from 'react-dom'
import { WindowResizeListener } from 'react-window-resize-listener'
import { compose, getContext, renderNothing, withContext, withProps } from 'recompose'

import ClockDisplayList from './ClockDisplayList'
import ConnectionList from './ConnectionList'
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
    this.layout.registerComponent('lm-lazy-react-component', LazyReactComponentHandler)

    registerComponentsInLayout(this.layout, this.context)

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
            // type: 'react-component',
            type: 'component',
            componentName: 'lm-lazy-react-component',
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
                    // type: 'react-component',
                    type: 'component',
                    componentName: 'lm-lazy-react-component',
                    component: 'connection-list',
                    title: 'Connections'
                  },
                  {
                    // type: 'react-component',
                    type: 'component',
                    componentName: 'lm-lazy-react-component',
                    component: 'clock-list',
                    title: 'Clocks'
                  }
                ]
              },
              {
                type: 'stack',
                content: [
                  {
                    // type: 'react-component',
                    type: 'component',
                    componentName: 'lm-lazy-react-component',
                    component: 'uav-list',
                    title: 'UAVs'
                  },
                  {
                    // type: 'react-component',
                    type: 'component',
                    componentName: 'lm-lazy-react-component',
                    component: 'messages',
                    title: 'Messages'
                  }
                ]
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
      <div id={'workbench'}>
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

/**
 * A specialised GoldenLayout component that binds GoldenLayout container
 * lifecycle events to React components, and that mounts the component
 * only when it is actually visible on the screen (i.e. is not in a
 * background tab).
 */
class LazyReactComponentHandler {

  /**
   * Constructor.
   *
   * @param {lm.container.ItemContainer}  container  the container that
   *        will contain the React component
   * @param {Object} state  the state of the React component; optional
   */
  constructor (container, state) {
    this._reactComponent = undefined
    this._originalComponentWillUpdate = undefined
    this._isVisible = false
    this._isOpen = false
    this._container = container
    this._initialState = state
    this._reactClass = this._getReactClass()
    this._container.on('open', this._open, this)
    this._container.on('destroy', this._destroy, this)
    this._container.on('show', this._show, this)
    this._container.on('hide', this._hide, this)
    this._onUpdate = this._onUpdate.bind(this)
  }

  _show () {
    this._isVisible = true
    this._mountIfNeeded()
  }

  _hide () {
    this._isVisible = false
    this._unmountIfNeeded()
  }

  _open () {
    this._isOpen = true
    this._mountIfNeeded()
  }

  /**
   * Removes the component from the DOM and thus invokes React's unmount
   * lifecycle.
   *
   * @private
   */
  _destroy () {
    this._isOpen = false
    this._isVisible = false
    this._unmountIfNeeded()

    this._container.off('open', this._open, this)
    this._container.off('destroy', this._destroy, this)
    this._container.off('show', this._show, this)
    this._container.off('hide', this._hide, this)
  }

  /**
   * Mounts the component to the DOM tree if it should be mounted and it is
   * not mounted yet.
   */
  _mountIfNeeded () {
    if (this._reactComponent || !this._isVisible || !this._isOpen) {
      return
    }

    this._reactComponent = render(
      this._createReactComponent(), this._container.getElement()[0]
    )

    this._originalComponentWillUpdate = this._reactComponent.componentWillUpdate ||
        function () {}
    this._reactComponent.componentWillUpdate = this._onUpdate

    const state = this._container.getState()
    if (state) {
      this._reactComponent.setState(state)
    }
  }

  /**
   * Unmounts the component from the DOM tree. This method is called when
   * the component is hidden or destroyed. It is safe to call this method
   * even if the component is already unmounted; nothing will happen in this
   * case.
   */
  _unmountIfNeeded () {
    if (this._reactComponent && (!this._isVisible || !this._isOpen)) {
      const firstElement = this._container.getElement()[0]
      unmountComponentAtNode(firstElement)

      this._reactComponent = undefined
      this._originalComponentWillUpdate = undefined
    }
  }

  /**
   * Hooks into React's state management and applies the component state
	 * to GoldenLayout
	 *
	 * @param  nextProps {Object}  the next set of properties for the React
	 *         component
	 * @param  nextState {Object}  the next state for the React component
	 */
  _onUpdate (nextProps, nextState) {
    this._container.setState(nextState)
    this._originalComponentWillUpdate.call(
      this._reactComponent, nextProps, nextState
    )
  }

  /**
	 * Retrieves the React class from GoldenLayout's registry
	 *
	 * @private
	 * @returns {React.Class}  the React class whose instance will be shown
	 *          in the layout
	 */
  _getReactClass () {
    const componentName = this._container._config.component
    if (!componentName) {
      throw new Error('No react component name. type: lazy-react-component ' +
                      'needs a field `component`')
    }

    const reactClass = this._container.layoutManager.getComponent(componentName)
    if (!reactClass) {
      throw new Error('React component "' + componentName + '" not found. ' +
        'Please register all components with GoldenLayout using `registerComponent(name, component)`')
    }

    return reactClass
  }

  /**
	 * Copies and extends the properties array and returns the React element
	 *
	 * @private
	 * @returns {React.Element}  the React component instance that will be
	 *          shown in the layout
	 */
  _createReactComponent () {
    const defaultProps = {
      glEventHub: this._container.layoutManager.eventHub,
      glContainer: this._container
    }
    const props = Object.assign(defaultProps, this._container._config.props)
    return React.createElement(this._reactClass, props)
  }

};

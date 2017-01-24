/**
 * @file List-related component helper functions and higher order components.
 */

import { get, partial } from 'lodash/fp'
import { isFunction } from 'lodash'
import { List } from 'material-ui/List'
import React, { PropTypes } from 'react'

/**
 * Creates a React component that renders items received in an array using
 * the given item renderer function, and optionally shows a small textual
 * hint instead if there are no items.
 *
 * @param  {function|React.Component} itemRenderer  function that is called
 *         with a single item to be rendered and the props of the generated
 *         component, and must return a React component that shows the item
 * @param  {Object}  options  additional options to tweak the behaviour of
 *         the generated list
 * @param  {string?}  options.backgroundHint  optional background hint to show in
 *         place of the list when there are no items
 * @param  {function|string} options.dataProvider  function that gets the React props
 *         of the generated component and returns the items to show, or a
 *         string that contains the name of the React prop that holds the
 *         items to show in the generated component
 * @param  {function|React.Component} options.listFactory  React component
 *         that will be used as the root component of the generated list,
 *         or a function that will be called with the props of the generated
 *         component and the children that are to be put into the root
 *         React component, and returns the root React component of the list
 *         populated with the children
 * @return {React.Component}  the constructed React component
 */
export function listOf (itemRenderer, options = {}) {
  const { backgroundHint, dataProvider, listFactory } = validateOptions(options)
  itemRenderer = validateItemRenderer(itemRenderer)

  // A separate variable is needed here to make ESLint happy
  const ListView = props => {
    const items = dataProvider(props)
    if (hasSomeItems(items)) {
      const children = items.map(item => itemRenderer(item, props))
      return listFactory(props, children)
    } else if (backgroundHint) {
      return <div className="background-hint">{backgroundHint}</div>
    } else {
      return null
    }
  }

  return ListView
}

/**
 * Creates a React component that renders items received in an array using
 * the given item renderer function, optionally shows a small textual
 * hint instead if there are no items, and allows the user to select a
 * single item by tapping or clicking on an item.
 *
 * The component returned from this function will have a property named
 * <code>value</code> that contains the <em>ID</em> of the selected item
 * (i.e. its <code>id</code> property), and a property named
 * <code>onChange</code> where it expects a callback function that
 * will be called whenever the selected item changes via tapping or clicking
 * on an item. <code>onChange</code> will be called with the event that
 * caused the change and the item that was selected.
 *
 * @param  {function|React.Component} itemRenderer  function that is called
 *         with a single item to be rendered, the props of the generated
 *         component, and a boolean denoting whether the item is currently
 *         selected, and must return a React component that shows the item
 * @param  {Object}  options  additional options to tweak the behaviour of
 *         the generated list
 * @param  {string?}  options.backgroundHint  optional background hint to show in
 *         place of the list when there are no items
 * @param  {function|string} options.dataProvider  function that gets the React props
 *         of the generated component and returns the items to show, or a
 *         string that contains the name of the React prop that holds the
 *         items to show in the generated component
 * @param  {function|React.Component} options.listFactory  React component
 *         that will be used as the root component of the generated list,
 *         or a function that will be called with the props of the generated
 *         component and returns the root React component of the list
 * @return {React.Component}  the constructed React component
 */
export function selectableListOf (itemRenderer, options = {}) {
  const { backgroundHint, dataProvider, listFactory } = validateOptions(options)
  itemRenderer = validateItemRenderer(itemRenderer)

  // A separate variable is needed here to make ESLint happy
  const SelectableListView = props => {
    const items = dataProvider(props)
    if (hasSomeItems(items)) {
      const children = items.map(item => itemRenderer(item, props, item.id === props.value))
      return listFactory(props, children)
    } else if (backgroundHint) {
      return <div className="background-hint">{backgroundHint}</div>
    } else {
      return null
    }
  }
  SelectableListView.propTypes = {
    children: PropTypes.node,
    onChange: PropTypes.func,
    value: PropTypes.any
  }
  return SelectableListView
}

/**
 * Helper function that makes some transformations on the options object
 * passed to list generation helper functions to ensure the type-correctness
 * of some of the arguments.
 *
 * @param  {Object} options  the options passed to the list generation helper
 * @return {Object} the transformed options
 */
function validateOptions (options) {
  return Object.assign({}, options, {
    dataProvider: validateDataProvider(options.dataProvider),
    listFactory: validateListFactory(options.listFactory)
  })
}

/**
 * Helper function that returns true if the given array or immutable List
 * contains at least one item.
 *
 * @param {Array|Immutable.Collection} array  the collection to test
 * @return {boolean}  whether the given array or immutable list contains
 *         at least one item
 */
function hasSomeItems (array) {
  return array && (array.length > 0 || array.size > 0)
}

/**
 * Helper function that ensures that the given object is a function that is
 * suitable as a data provider function in the list generation helpers.
 *
 * @param  {function|string} dataProvider  function that gets the React props
 *         of the generated component and returns the items to show, or a
 *         string that contains the name of the React prop that holds the
 *         items to show in the generated component
 * @return {function} the input argument converted into a function
 */
function validateDataProvider (dataProvider) {
  return isFunction(dataProvider) ? dataProvider : get(dataProvider)
}

/**
 * Helper function that validates the incoming itemRenderer argument of the
 * list component generation methods. When the incoming argument is a React
 * component, it returns a function that generates a new instance of that
 * component, filled with the item as its props. Otherwise it returns the
 * incoming argument intact.
 *
 * @param  {function|React.Component} itemRenderer  the item renderer function
 *         or component
 * @return {function}  the incoming item renderer function, intact, or the
 *         incoming React component converted into a suitable item renderer
 *         function
 */
function validateItemRenderer (itemRenderer) {
  if (React.Component.isPrototypeOf(itemRenderer)) {
    /* eslint-disable react/display-name */
    return (item, props, selected) => {
      return React.createElement(itemRenderer,
        Object.assign({}, item, { key: item.id, selected: selected })
      )
    }
    /* eslint-enable react/display-name */
  } else {
    return itemRenderer
  }
}

/**
 * Helper function that validates the incoming <code>listFactory</code>
 * argument of the list component generation methods. When the incoming
 * argument is a React component, it returns a function that returns this
 * component; otherwise it returns the incoming argument intact.
 *
 * @param  {function|React.Component|undefined} listFactory  the list
 *         factory function or component
 * @return {function} the incoming list factory function, intact, or a
 *         function that returns the incoming React component, or undefined
 *         if the incoming argument was undefined
 */
function validateListFactory (listFactory) {
  if (listFactory === undefined) {
    /* eslint-disable react/display-name */
    return (props, children) => {
      return React.createElement(List, {}, children)
    }
    /* eslint-enable react/display-name */
  } else if (React.Component.isPrototypeOf(listFactory)) {
    return partial(React.createElement, listFactory)
  } else {
    return listFactory
  }
}

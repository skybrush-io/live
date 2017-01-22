/**
 * @file List-related component helper functions and higher order components.
 */

import { get } from 'lodash/fp'
import { isFunction } from 'lodash'
import { List } from 'material-ui/List'
import React from 'react'

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
 *         component and returns the root React component of the list
 * @return {React.Component}  the constructed React component
 */
export function listOf (itemRenderer, options = {}) {
  const { backgroundHint } = options
  const dataProvider = validateDataProvider(options.dataProvider)
  const listFactory = validateListFactory(options.listFactory)

  itemRenderer = validateItemRenderer(itemRenderer)

  const ListView = props => {
    const items = dataProvider(props)
    const listComponent = listFactory ? listFactory(props) : List
    if (hasSomeItems(items)) {
      return React.createElement(listComponent, {}, items.map(
        item => itemRenderer(item, props)
      ))
    } else if (backgroundHint) {
      return <div className="background-hint">{backgroundHint}</div>
    } else {
      return null
    }
  }

  return ListView
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
    return item => {
      return React.createElement(itemRenderer,
        Object.assign({}, item, { key: item.id })
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
  if (React.Component.isPrototypeOf(listFactory)) {
    return () => listFactory
  } else {
    return listFactory
  }
}

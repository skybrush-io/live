/**
 * @file List-related component helper functions and higher order components.
 */

import get from 'lodash-es/get';
import identity from 'lodash-es/identity';
import includes from 'lodash-es/includes';
import isFunction from 'lodash-es/isFunction';
import partial from 'lodash-es/partial';
import xor from 'lodash-es/xor';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import PropTypes from 'prop-types';
import React from 'react';
import { isElement } from 'react-is';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';

import { eventHasPlatformModifierKey } from '~/utils/platform';

const createBackgroundHint = (backgroundHint, ref) => {
  if (isElement(backgroundHint)) {
    return <div>{backgroundHint}</div>;
  }

  if (backgroundHint) {
    return <BackgroundHint ref={ref} text={backgroundHint} />;
  }

  return null;
};

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
 * @param  {function}  options.postprocess  post-processor function that will
 *         be called with the items generated for the list and the props of the
 *         list, and must return the actual list of items to be included in the
 *         list. Can be used to add extra items to the list without modifying
 *         the data provider.
 * @param  {function|React.Component} options.listFactory  React component
 *         that will be used as the root component of the generated list,
 *         or a function that will be called with the props of the generated
 *         component and the children that are to be put into the root
 *         React component, and returns the root React component of the list
 *         populated with the children
 * @return {React.Component}  the constructed React component
 */
export function listOf(itemRenderer, options = {}) {
  const { backgroundHint, dataProvider, listFactory, postprocess } =
    validateOptions(options);
  itemRenderer = validateItemRenderer(itemRenderer);

  // A separate variable is needed here to make ESLint happy
  const ListView = React.forwardRef((props, ref) => {
    const items = dataProvider(props);
    const children = postprocess(
      items.map((item) => itemRenderer(item, props)),
      props
    );
    if (hasSomeItems(children)) {
      return listFactory(props, children, ref);
    }

    return createBackgroundHint(backgroundHint, ref);
  });

  return ListView;
}

/**
 * Creates a selection event handler factory that encapsulates the common
 * logic for selection handling in lists.
 *
 * This function takes three functions as inputs: one that returns the current
 * selection in a list, another one that sets the selection in the list, and
 * an optional third one that will be invoked when an item is activated by
 * double-clicking on it.
 *
 * The result is an event handler _factory_ that can be called with a single
 * item ID and that returns an event handler that sets the selection to this
 * item when it receives an event without the Ctrl (Cmd) key being pressed,
 * and that _toggles_ the item in the current selection when it receives an
 * event _with_ the Ctrl (Cmd) key being pressed.
 */
export function createSelectionHandlerFactory({
  activateItem,
  getSelection,
  setSelection,
}) {
  if (!setSelection && !activateItem) {
    return () => undefined;
  }

  return (id) => (event) => {
    const selection = getSelection ? getSelection() : [];

    if (eventHasPlatformModifierKey(event.nativeEvent || event)) {
      // Toggling the item
      return setSelection(xor(selection, [id]));
    }

    // Cater for the common case when we are re-selecting an item; no need to
    // dispatch an action again, but we need to fire activateItem if we have
    // one
    if (selection && selection.length === 1 && selection[0] === id) {
      if (activateItem) {
        // Item was already selected, let's activate it
        return activateItem(id);
      } else {
        // Item was already selected, no need to dispatch an action
        return;
      }
    }

    // Select the item
    return setSelection([id]);
  };
}

/**
 * Creates a Redux thunk action that encapsulates the common logic for
 * selection handling in lists. The thunk has to be associated to the "click"
 * event handler of each item in the list, and it must be called with the
 * click event as the first argument and a unique item ID as the second argument.
 *
 * The thunk action will catch clicks on the items and dispatch actions to set
 * the selection accordingly when the items are clicked, or toggling the
 * selection when the items are clicked with the Ctrl (Cmd) key being pressed.
 * It also handles optional item activation with double-clicks.
 */
export function createSelectionHandlerThunk({
  activateItem,
  getSelection,
  setSelection,
}) {
  if (!setSelection && !activateItem) {
    return null;
  }

  return (event, id) => (dispatch, getState) => {
    const state = getState();
    const selection = getSelection ? getSelection(state) : [];
    let action;

    if (eventHasPlatformModifierKey(event.nativeEvent || event)) {
      // Toggling the item
      action = setSelection(xor(selection, [id]));
    } else {
      const alreadySelected =
        selection && selection.length === 1 && selection[0] === id;

      if (activateItem && alreadySelected) {
        // Item was already selected, let's activate it if it is a double-click,
        // otherwise do nothing. We use the "detail" property of the
        // event to decide; this works if we are attached to the onClick handler.
        action = event.detail > 1 ? activateItem(id) : null;
        if (event.detail > 1) {
          // Double-clicking may have triggered a text selection on the UI. We
          // are too late to prevent it because it happens on mouseDown, so let's
          // just clear it.
          window.getSelection().removeAllRanges();
        }
      } else if (setSelection && !alreadySelected) {
        // Select the item if it was not selected already
        action = setSelection([id]);
      }
    }

    if (action) {
      dispatch(action);
    }
  };
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
 * caused the change and the ID of the item that was selected.
 *
 * In order to make this happen, there is one final ingredient: we need
 * to "tell" our item renderer when to consider an item to be "selected" by
 * the user. The props passed to the component that the item renderer
 * returns contains a property named <code>onItemSelected</code>. This is
 * a function that expects an event and that calls the <code>onChange</code>
 * prop of the generated list component with the event itself and the item
 * that was selected. You need to wire this prop to the appropriate event
 * handler of your item renderer in order to make the list item respond to
 * the user's action.
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
export function selectableListOf(itemRenderer, options = {}) {
  const { backgroundHint, dataProvider, listFactory, postprocess } =
    validateOptions(options);
  itemRenderer = validateItemRenderer(itemRenderer);

  // A separate variable is needed here to make ESLint happy
  const SelectableListView = React.forwardRef((props, ref) => {
    const items = dataProvider(props);
    const children = postprocess(
      items.map((item) =>
        itemRenderer(
          item,
          {
            ...props,
            onChange: undefined,
            onItemSelected: props.onChange
              ? (event) => props.onChange(event, item.id)
              : undefined,
          },
          item.id === props.value
        )
      ),
      props
    );
    if (hasSomeItems(children)) {
      return listFactory(props, children, ref);
    }

    return createBackgroundHint(backgroundHint, ref);
  });

  SelectableListView.propTypes = {
    onChange: PropTypes.func,
    value: PropTypes.any,
  };
  return SelectableListView;
}

/**
 * Creates a React component that renders items received in an array using
 * the given item renderer function, optionally shows a small textual
 * hint instead if there are no items, and allows the user to select
 * multiple items by tapping or clicking on an item.
 *
 * The component returned from this function will have a property named
 * <code>value</code> that contains the <em>IDs</em> of the selected items
 * (i.e. their <code>id</code> properties), and a property named
 * <code>onChange</code> where it expects a callback function that
 * will be called whenever the selected items change via tapping or clicking
 * on an item. <code>onChange</code> will be called with the event that
 * caused the change and the new selection (with item IDs).
 *
 * In order to make this happen, there is one final ingredient: we need
 * to "tell" our item renderer when to consider an item to be "selected" by
 * the user. The props passed to the component that the item renderer
 * returns contains a property named <code>onItemSelected</code>. This is
 * a function that expects an event and that calls the <code>onChange</code>
 * prop of the generated list component with the event itself and the new
 * selection. You need to wire this prop to the appropriate event
 * handler of your item renderer in order to make the list item respond to
 * the user's action.
 *
 * The new selection is calculated from the old one with the following
 * ruleset:
 *
 * - Clicking on an item will change the selection to include that item only.
 *
 * - Clicking on an item while holding the Cmd (Ctrl on Windows) key will
 *   include the item in the selection if it was not in the selection yet,
 *   or exclude it from the selection if it was in the selection.
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
export function multiSelectableListOf(itemRenderer, options = {}) {
  const { backgroundHint, dataProvider, listFactory, postprocess } =
    validateOptions(options);
  itemRenderer = validateItemRenderer(itemRenderer);

  // A separate variable is needed here to make ESLint happy
  const MultiSelectableListView = React.forwardRef((props, ref) => {
    const items = dataProvider(props);
    const onItemSelected = createSelectionHandlerFactory({
      activateItem: props.onActivate,
      getSelection: () => props.value,
      setSelection: props.onChange,
    });
    const children = postprocess(
      items.map((item) =>
        itemRenderer(
          item,
          {
            ...props,
            onChange: undefined,
            onItemSelected: onItemSelected(item.id),
          },
          includes(props.value, item.id)
        )
      ),
      props
    );
    if (hasSomeItems(children)) {
      return listFactory(props, children, ref);
    }

    return createBackgroundHint(backgroundHint, ref);
  });

  MultiSelectableListView.propTypes = {
    onActivate: PropTypes.func,
    onChange: PropTypes.func,
    value: PropTypes.arrayOf(PropTypes.any).isRequired,
  };

  return MultiSelectableListView;
}

/**
 * Helper function that makes some transformations on the options object
 * passed to list generation helper functions to ensure the type-correctness
 * of some of the arguments.
 *
 * @param  {Object} options  the options passed to the list generation helper
 * @return {Object} the transformed options
 */
const validateOptions = (options) => ({
  postprocess: identity,
  ...options,
  dataProvider: validateDataProvider(options.dataProvider),
  listFactory: validateListFactory(options.listFactory),
});

/**
 * Helper function that returns true if the given array or immutable List
 * contains at least one item.
 *
 * @param {Array|Immutable.Collection} array  the collection to test
 * @return {boolean}  whether the given array or immutable list contains
 *         at least one item
 */
function hasSomeItems(array) {
  return array && (array.length > 0 || array.size > 0);
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
function validateDataProvider(dataProvider) {
  return isFunction(dataProvider)
    ? dataProvider
    : (value) => get(value, dataProvider);
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
function validateItemRenderer(itemRenderer) {
  if (Object.prototype.isPrototypeOf.call(React.Component, itemRenderer)) {
    /* eslint-disable react/prop-types */
    const clickHandler = itemRenderer === ListItem ? 'onTouchTap' : 'onClick';
    return (item, props, selected) => {
      return React.createElement(itemRenderer, {
        ...item,
        key: item.id,
        [clickHandler]: props.onItemSelected,
        selected,
      });
    };
    /* eslint-enable react/prop-types */
  }

  return itemRenderer;
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
function validateListFactory(listFactory) {
  if (listFactory === undefined) {
    /* eslint-disable react/prop-types */
    return (props, children, ref) => {
      return React.createElement(
        List,
        {
          dense: props.dense || props.mini,
          disablePadding: props.disablePadding || props.mini,
          ref,
        },
        children
      );
    };
    /* eslint-enable react/prop-types */
  }

  if (Object.prototype.isPrototypeOf.call(React.Component, listFactory)) {
    return partial(React.createElement, listFactory);
  }

  return listFactory;
}

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/ban-types */
/**
 * @file List-related component helper functions and higher order components.
 */

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import type { AnyAction } from '@reduxjs/toolkit';
import get from 'lodash-es/get';
import identity from 'lodash-es/identity';
import includes from 'lodash-es/includes';
import isFunction from 'lodash-es/isFunction';
import partial from 'lodash-es/partial';
import xor from 'lodash-es/xor';
import PropTypes from 'prop-types';
import React, { type PropsWithoutRef, type RefAttributes } from 'react';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';

import type { AppDispatch, RootState } from '~/store/reducers';
import { eventHasShiftKey } from '~/utils/events';
import { eventHasPlatformModifierKey } from '~/utils/platform';

type ItemWithId = { id: string };
type ItemRenderer<T extends ItemWithId, P> = (
  item: T,
  props: P,
  selected?: boolean
) => React.ReactElement;
type ListFactory<P> = (
  props: P,
  children: React.ReactElement[],
  ref: React.ForwardedRef<unknown>
) => JSX.Element;

type ValidatedListOfOptions<T, P> = {
  backgroundHint?: string | React.ReactElement;
  dataProvider: (props: P) => T[];
  displayName?: string;
  listFactory: ListFactory<P>;
  postprocess: (items: React.ReactElement[], props: P) => React.ReactElement[];
};

type ListOfOptions<T, P> = Omit<
  Partial<ValidatedListOfOptions<T, P>>,
  'dataProvider' | 'listFactory'
> & {
  listFactory?: undefined | ListFactory<P> | React.ComponentType<P>;
  dataProvider?: string | ((props: P) => T[]);
};
type SelectableListProps<T> = {
  onChange?: (event: React.UIEvent, item: T) => void;
  value: string;
};

type MultiSelectableListProps = {
  onActivate?: (item: string) => void;
  onChange?: (items: string[]) => void;
  value: string[];
};

type SelectionHandlerFunctions<T = string> = {
  activateItem?: (item: T) => void;
  getSelection: () => T[];
  setSelection?: (value: T[]) => void;
};

type SelectionHandlerReduxFunctions<T = string> = {
  activateItem?: (item: T) => AnyAction | undefined | void;
  getSelection: (state: RootState) => T[];
  setSelection?: (value: T[]) => AnyAction | undefined | void;
  getListItems?: (state: RootState) => T[];
};

const createBackgroundHint = (
  backgroundHint: string | React.ReactElement | undefined,
  ref: React.ForwardedRef<unknown>
): JSX.Element | null => {
  switch (typeof backgroundHint) {
    case 'string':
      return <BackgroundHint ref={ref} text={backgroundHint} />;
    case 'undefined':
      return null;
    default:
      return backgroundHint ? <div>{backgroundHint}</div> : null;
  }
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
 * @param  {string} options.displayName  name of the component when used in
 *         React debugging views
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
export function listOf<T extends ItemWithId, P>(
  itemRenderer: ItemRenderer<T, P>,
  options: ListOfOptions<T, P> = {}
): React.ForwardRefExoticComponent<
  PropsWithoutRef<P> & RefAttributes<unknown>
> {
  const {
    backgroundHint,
    dataProvider,
    displayName,
    listFactory,
    postprocess,
  } = validateOptions(options);
  itemRenderer = validateItemRenderer(itemRenderer);

  // A separate variable is needed here to make ESLint happy
  const ListView = React.forwardRef((props: P, ref) => {
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

  if (displayName) {
    ListView.displayName = displayName;
  }

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
export function createSelectionHandlerFactory<T = string>({
  activateItem,
  getSelection,
  setSelection,
}: SelectionHandlerFunctions<T>) {
  if (!setSelection && !activateItem) {
    return (): undefined => undefined;
  }

  return (id: T) =>
    (event: React.UIEvent): void => {
      const selection = getSelection ? getSelection() : [];

      if (
        eventHasPlatformModifierKey(event.nativeEvent || event) && // Toggling the item
        setSelection
      ) {
        setSelection(xor(selection, [id]));
      }

      // Cater for the common case when we are re-selecting an item; no need to
      // dispatch an action again, but we need to fire activateItem if we have
      // one
      if (selection && selection.length === 1 && selection[0] === id) {
        if (activateItem) {
          // Item was already selected, let's activate it
          activateItem(id);
        } else {
          // Item was already selected, no need to dispatch an action
          return;
        }
      }

      // Select the item
      if (setSelection) {
        setSelection([id]);
      }
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
export function createSelectionHandlerThunk<T = string>({
  activateItem,
  getSelection,
  setSelection,
  getListItems,
}: SelectionHandlerReduxFunctions<T>) {
  if (!setSelection && !activateItem) {
    return null;
  }

  return (id: T, event: React.UIEvent) =>
    // eslint-disable-next-line complexity
    (dispatch: AppDispatch, getState: () => RootState) => {
      const state = getState();
      const selection = getSelection ? getSelection(state) : [];
      let action;

      if (
        eventHasPlatformModifierKey(event.nativeEvent || event) &&
        setSelection
      ) {
        // Toggling the item
        action = setSelection(xor(selection, [id]));
      } else if (
        eventHasShiftKey(event.nativeEvent || event) &&
        getListItems &&
        setSelection
      ) {
        const listItems = getListItems(state);
        if (selection.length > 0) {
          // NOTE: Bang justified by `selection.length === 1`
          const singleSelectedId = selection.at(-1)!;
          const singleSelectedIndex = listItems.indexOf(singleSelectedId);
          const newSelectedIndex = listItems.indexOf(id);
          const newSelection = listItems.slice(
            Math.min(singleSelectedIndex, newSelectedIndex),
            Math.max(singleSelectedIndex, newSelectedIndex) + 1
          );

          // Make sure that singleSelectedId remains at the end of the selection
          // array in case the user keeps on clicking on other items with the
          // Shift key being held down
          const index = newSelection.indexOf(singleSelectedId);
          if (index >= 0 && index !== newSelection.length - 1) {
            newSelection.splice(index, 1);
            newSelection.push(singleSelectedId);
          }

          action = setSelection(newSelection);
        }
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
            window.getSelection()?.removeAllRanges();
          }
        } else if (
          setSelection &&
          !alreadySelected // Select the item if it was not selected already
        ) {
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
 * @param  {string} options.displayName  name of the component when used in
 *         React debugging views
 * @param  {function|React.Component} options.listFactory  React component
 *         that will be used as the root component of the generated list,
 *         or a function that will be called with the props of the generated
 *         component and returns the root React component of the list
 * @return {React.Component}  the constructed React component
 */
export function selectableListOf<
  T extends ItemWithId,
  P extends SelectableListProps<T>,
>(
  itemRenderer: ItemRenderer<T, P>,
  options: Partial<ValidatedListOfOptions<T, P>> = {}
): React.ForwardRefExoticComponent<
  PropsWithoutRef<P> & React.RefAttributes<unknown>
> {
  const {
    backgroundHint,
    dataProvider,
    displayName,
    listFactory,
    postprocess,
  } = validateOptions(options);
  itemRenderer = validateItemRenderer(itemRenderer);

  // A separate variable is needed here to make ESLint happy
  const SelectableListView = React.forwardRef((props: P, ref) => {
    const items = dataProvider(props);
    const children = postprocess(
      items.map((item) =>
        itemRenderer(
          item,
          {
            ...props,
            onChange: undefined,
            onItemSelected: props.onChange
              ? (event: React.UIEvent) => {
                  props.onChange!(event, item);
                }
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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  SelectableListView.propTypes = {
    onChange: PropTypes.func,
    value: PropTypes.string,
  } as any;

  if (displayName) {
    SelectableListView.displayName = displayName;
  }

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
 * @param  {string} options.displayName  name of the component when used in
 *         React debugging views
 * @param  {function|React.Component} options.listFactory  React component
 *         that will be used as the root component of the generated list,
 *         or a function that will be called with the props of the generated
 *         component and returns the root React component of the list
 * @return {React.Component}  the constructed React component
 */
export function multiSelectableListOf<
  T extends ItemWithId,
  P extends MultiSelectableListProps,
>(
  itemRenderer: ItemRenderer<T, P>,
  options: Partial<ValidatedListOfOptions<T, P>> = {}
): React.ForwardRefExoticComponent<
  PropsWithoutRef<P> & React.RefAttributes<unknown>
> {
  const {
    backgroundHint,
    dataProvider,
    displayName,
    listFactory,
    postprocess,
  } = validateOptions(options);
  itemRenderer = validateItemRenderer(itemRenderer);

  // A separate variable is needed here to make ESLint happy
  const MultiSelectableListView = React.forwardRef((props: P, ref) => {
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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  MultiSelectableListView.propTypes = {
    onActivate: PropTypes.func,
    onChange: PropTypes.func,
    value: PropTypes.arrayOf(PropTypes.string).isRequired,
  } as any;

  if (displayName) {
    MultiSelectableListView.displayName = displayName;
  }

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
const validateOptions = <T, P>(
  options: ListOfOptions<T, P>
): ValidatedListOfOptions<T, P> => ({
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
function hasSomeItems(array: any): array is unknown[] {
  return Array.isArray(array) && array.length > 0;
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
function validateDataProvider<T, P>(
  dataProvider: ListOfOptions<T, P>['dataProvider']
): (props: P) => T[] {
  return isFunction(dataProvider)
    ? dataProvider
    : (value: P) => get(value, dataProvider as any) as T[];
}

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

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
function validateItemRenderer<T extends ItemWithId, P>(
  itemRenderer: ItemRenderer<T, P> | React.ComponentType<P>
): ItemRenderer<T, P> {
  if (Object.prototype.isPrototypeOf.call(React.Component, itemRenderer)) {
    /* eslint-disable react/prop-types */
    const clickHandler = itemRenderer === ListItem ? 'onTouchTap' : 'onClick';
    return (item: T, props: P, selected = false) => {
      return React.createElement(itemRenderer as any, {
        ...item,
        key: item.id,
        [clickHandler]: (props as any).onItemSelected,
        selected,
      });
    };
    /* eslint-enable react/prop-types */
  } else {
    return itemRenderer as ItemRenderer<T, P>;
  }
}

/**
 * Helper function that validates the incoming <code>listFactory</code>
 * argument of the list component generation methods. When the incoming
 * argument is a React component, it returns a function that returns this
 * component; otherwise it returns the incoming argument intact.
 *
 * @param  listFactory  the list factory function or component
 * @return the incoming list factory function, intact, or a
 *         function that returns the incoming React component, or undefined
 *         if the incoming argument was undefined
 */
function validateListFactory<P>(
  listFactory: undefined | React.ComponentType<P> | ListFactory<P>
): ListFactory<P> {
  if (listFactory === undefined) {
    return (
      props: P,
      children: React.ReactElement[],
      ref: React.ForwardedRef<unknown>
    ) => {
      const anyProps = props as any;
      return React.createElement(
        List,
        {
          dense: anyProps.dense || anyProps.mini,
          disablePadding: anyProps.disablePadding || anyProps.mini,
          ref: ref as any,
        },
        children
      );
    };
  }

  if (Object.prototype.isPrototypeOf.call(React.Component, listFactory)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return partial(React.createElement, listFactory as any) as any;
  }

  return listFactory as ListFactory<P>;
}

/* eslint-enable @typescript-eslint/no-unsafe-assignment */
/* eslint-enable @typescript-eslint/no-unsafe-argument */

/**
 * @file Context menu using a Popover element that displays connands to send to the
 * currently selected UAVs.
 */

import isFunction from 'lodash-es/isFunction';
import PropTypes from 'prop-types';
import React from 'react';

import MenuList from '@material-ui/core/MenuList';

import {
  ContainerContext,
  PopoverWithContainerFromContext as Popover,
} from '~/containerContext';

/**
 * Generic context menu using a Material-UI popover element.
 *
 * This component handles the logic related to opening and closing the context
 * menu. The actual menu items must be declared as children of this
 * component.
 */
export default class ContextMenu extends React.Component {
  static contextType = ContainerContext;

  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    contextProvider: PropTypes.func,
  };

  state = {
    open: false,
    opening: false,
    position: {
      top: 0,
      left: 0,
    },
    context: undefined,
  };

  /**
   * Public method to open the context menu.
   *
   * @param {Object} position Coordinates where the absolutely positioned popup
   *        should appear.
   * @property {number} left The offset of the context menu from the left edge of the page.
   * @property {number} top The offset of the context menu from the top edge of the page.
   * @param {Object} context Context object to pass to the click handlers of
   *        the menu items as their second argument.
   */
  open(position, context) {
    const { contextProvider } = this.props;

    const containerContext = this.context;
    // Prevent the container of the tooltip from firing a contextmenu event
    containerContext.addEventListener('contextmenu', this._preventDefault);
    // (It's an unfortunate naming clash, but note, that `this.context` and
    // `context` are two completely unrelated things, the former comes from
    // the React context `ContainerContext`.)

    // Start opening the context menu
    this.setState({
      opening: true,
      open: false,
      context: contextProvider ? contextProvider(context) : context,
      position,
    });
  }

  /**
   * Private method to request the closing of the context menu when the user
   * selects a menu item or clicks away.
   */
  _handleClose = () => {
    document.body.removeEventListener('contextmenu', this._preventDefault);

    this.setState({
      open: false,
      opening: false,
      // Don't set the context to undefined here -- you could be running into
      // strange problems with disappearing menu items during the animation
      // when the menu fades out
    });
  };

  /**
   * Right click handler to prevent the default context menu of the browser
   * while the menu is opening and close it if the event happens when it's
   * already open.
   *
   * @param {MouseEvent} e The event being fired.
   */
  _preventDefault = (event) => {
    if (this.state.opening) {
      this.setState({ opening: false, open: true });
    } else {
      this._handleClose();
    }

    event.preventDefault();
  };

  render() {
    const { children } = this.props;
    const { context, open, opening, position } = this.state;
    const effectiveChildren = isFunction(children)
      ? children(context || {})
      : children;

    const menuItems = React.Children.map(effectiveChildren, (child) =>
      React.cloneElement(child, {
        onClick: child.props.onClick
          ? (event) => {
              child.props.onClick(event, context);
              this._handleClose();
            }
          : () => {
              this._handleClose();
            },
      })
    );

    return (
      <Popover
        open={open || opening}
        anchorReference='anchorPosition'
        anchorPosition={position}
        onClose={this._handleClose}
      >
        <MenuList>{menuItems}</MenuList>
      </Popover>
    );
  }
}

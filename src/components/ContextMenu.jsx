/**
 * @file Context menu using a Popover element that displays connands to send to the
 * currently selected UAVs.
 */

import { autobind } from 'core-decorators'
import PropTypes from 'prop-types'
import React from 'react'

import Popover from 'material-ui/Popover'
import Menu from 'material-ui/Menu'

/**
 * Generic context menu using a Material-UI popover element.
 *
 * This component handles the logic related to opening and closing the context
 * menu. The actual menu items must be declared as children of this
 * component.
 */
export default class ContextMenu extends React.Component {
  constructor (props) {
    super(props)

    this._assignAnchorRef = (value) => { this.setState({ anchor: value }) }

    this.state = {
      open: false,
      opening: false,
      position: {
        x: 0,
        y: 0
      }
    }
  }

  /**
   * Public method to open the context menu.
   *
   * @param {Object} position Coordinates where the absolutely positioned popup
   * should appear.
   * @property {number} x The value to forward as `left` into the style object.
   * @property {number} y The value to forward as `top` into the style object.
   */
  open (position) {
    // Prevent the document body from firing a contextmenu event
    document.body.addEventListener(
      'contextmenu', this._preventDefault
    )

    // Start opening the context menu
    this.setState({
      opening: true,
      open: false,
      position
    })
  }

  /**
   * Private method to request the closing of the context menu when the user
   * selects a menu item or clicks away.
   */
  @autobind
  _handleRequestClose () {
    document.body.removeEventListener(
      'contextmenu', this._preventDefault
    )

    this.setState({
      open: false, opening: false
    })
  }

  /**
   * Right click handler to prevent the default context menu of the browser
   * while the menu is opening and close it if the event happens when it's
   * already open.
   *
   * @param {MouseEvent} e The event being fired.
   */
  @autobind
  _preventDefault (e) {
    if (this.state.opening) {
      this.setState({ opening: false, open: true })
    } else {
      this._handleRequestClose()
    }

    e.preventDefault()
  }

  render () {
    const { animated, children } = this.props
    const { open, opening, position } = this.state
    const anchor = (
      <div style={{ position: 'absolute', left: position.x, top: position.y }}
        ref={this._assignAnchorRef} />
    )

    const menuItems = React.Children.map(children,
      child => React.cloneElement(child,
        {
          onClick: child.props.onClick
            ? event => {
              child.props.onClick(event)
              this._handleRequestClose()
            }
            : undefined
        }
      )
    )

    return (
      <div>
        { anchor }
        <Popover
          animated={!!animated}
          open={open || opening}
          anchorEl={this.state.anchor}
          anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
          targetOrigin={{horizontal: 'left', vertical: 'top'}}
          onRequestClose={this._handleRequestClose}
        >
          <Menu desktop>
            {menuItems}
          </Menu>
        </Popover>
      </div>
    )
  }
}

ContextMenu.propTypes = {
  animated: PropTypes.bool,
  children: PropTypes.node
}

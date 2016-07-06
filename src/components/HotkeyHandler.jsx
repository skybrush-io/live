/**
 * @file React Component for handling hotkeys.
 */

import React, {PropTypes} from 'react'
import _ from 'lodash'

/**
 * React Component for handling hotkeys.
 *
 * @param {Object} props properties of the react component
 * @property {Signal} hotkeys Array containing the desired hotkeys and actions
 */
export default class HotkeyHandler extends React.Component {
  /**
   * Constructor that binds the actions to the key combinations.
   *
   * @param {Object} props properties of the react component
   * @property {Signal} hotkeys Array containing the desired hotkeys and actions
   */
  constructor (props) {
    super(props)

    this.currentlyDown = {}

    this.listeners = { down: {}, up: {} }

    this.handleKey_ = this.handleKey_.bind(this)

    for (const hotkey of props.hotkeys) {
      this.addListener(hotkey.on, hotkey.keys, hotkey.action)
    }
  }

  /**
   * Adding the actual event listeners and the approptiate handlers.
   */
  componentDidMount () {
    this.refs.capture.addEventListener(
      'keydown', (e) => { this.handleKey_('down', e) }, true
    )
    this.refs.capture.addEventListener(
      'keyup', (e) => { this.handleKey_('up', e) }, true
    )
  }

  render () {
    return (
      <div ref="capture">
        {this.props.children}
      </div>
    )
  }

  /**
   * Function for adding a new action to a key combination.
   *
   * @param {string} on 'down' or 'up', on which event the action should be fired
   * @param {string} keys the key combination to activate the action
   * @param {function} action the action to be performed
   */
  addListener (on, keys, action) {
    const hash = this.hotkeyToHash_(keys)

    if (!(hash in this.listeners[on])) {
      this.listeners[on][hash] = []
    }

    this.listeners[on][hash].push(action)
  }

  /**
   * Function for removing an existing action from a key combination.
   *
   * @param {string} on 'down' or 'up', on which event the action should be fired
   * @param {string} keys the key combination to activate the action
   * @param {function} action the action to be performed
   */
  removeListener (on, keys, action) {
    const hash = this.hotkeyToHash_(keys)

    if (hash in this.listeners[on]) {
      _.pull(this.listeners[on][hash], action)
    }
  }

  /**
   * Event handler function that looks for attached actions and executes them.
   *
   * @param {string} on 'down' or 'up', on which event the action should be fired
   * @param {KeyboardEvent} e the actual keyboard event
   */
  handleKey_ (on, e) {
    const hashes = [
      (e.altKey ? 'Alt + ' : '') +
      (e.ctrlKey ? 'Ctrl + ' : '') +
      (e.shiftKey ? 'Shift + ' : '') +
      e.code
    ]

    if (e.ctrlKey || e.metaKey) {
      hashes.push(
        (e.altKey ? 'Alt + ' : '') +
        'PlatMod + ' +
        (e.shiftKey ? 'Shift + ' : '') +
        e.code
      )
    }

    for (const hash of hashes) {
      if (hash in this.listeners[on]) {
        // Avoiding key repetition
        if (on === 'down' && !(hash in this.currentlyDown)) {
          this.currentlyDown[hash] = true
        } else if (on === 'up') {
          delete this.currentlyDown[hash]
        } else {
          return
        }

        e.preventDefault()

        for (const callback of this.listeners[on][hash]) {
          callback()
        }
      }
    }
  }

  /**
   * Function for converting hotkey into uniform hash.
   *
   * @param {string} hotkey the key combination to activate the action
   *
   * @return {string} the unified hotkey identifier
   */
  hotkeyToHash_ (hotkey) {
    return Hotkey.fromString(hotkey).toString()
  }
}

HotkeyHandler.condition = {
  Alt: e => e.altKey,
  Ctrl: e => e.ctrlKey,
  Meta: e => e.metaKey,
  PlatMod: e => navigator.platform.indexOf('Mac') !== -1 ? e.metaKey : e.ctrlKey,
  Shift: e => e.shiftKey
}

HotkeyHandler.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]),
  hotkeys: PropTypes.arrayOf(PropTypes.shape({
    keys: PropTypes.string,
    action: PropTypes.func
  }))
}

HotkeyHandler.defaultProps = {
  hotkeys: []
}

class Hotkey {
  /**
   * Function for creating a Hotkey object from a string.
   *
   * @param {string} string the key combination
   *
   * @return {Hotkey} the processed Hotkey object
   */
  static fromString (string) {
    const data = _(string).split('+').map(_.trim).map(_.upperFirst).value()
    const result = new Hotkey()
    result.key = data.pop()
    result.modifiers = data.sort()

    for (const modifier of result.modifiers) {
      if (!(modifier in HotkeyHandler.condition)) {
        throw new Error(`Unknown modifier '${modifier}' in hotkey '${string}'.`)
      }
    }

    return result
  }

  /**
   * Function for converting a Hotkey object into a string.
   *
   * @return {string} the string representation of the Hotkey object
   */
  toString () {
    return [...this.modifiers, this.key].join(' + ')
  }
}

/**
 * @file React Component for handling hotkeys.
 */

import _ from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'
import u from 'updeep'

import Button from 'material-ui/Button'
import Dialog, { DialogActions, DialogContent, DialogTitle } from 'material-ui/Dialog'
import Table, { TableBody, TableCell, TableRow } from 'material-ui/Table'

import { isRunningOnMac, platformModifierKey } from '../utils/platform'

/**
 * Formats the given hotkey definition string to make it suitable for
 * the user.
 *
 * This function replaces all occurrences of "Cmd" with the standard
 * "command" symbol and all occurrences of "Alt" with the standard
 * "option" symbol on a Mac (i.e. Unicode code points U+2318 and U+2325).
 * It also replaces "Shift" with the standard "shift" symbol (Unicode code
 * point U+21E7) on all platforms, "PlatMod" with "Ctrl" on Windows and the
 * "command" symbol on a Mac, gets rid of the "Key" prefix and wraps each
 * key in a <code>&lt;kbd&gt;</code> tag.
 *
 * @param {string} definition  the hotkey definition string to format
 * @return {array} the formatted hotkey definition as an array of JSX tags
 */
function formatHotkeyDefinition (definition) {
  return _(definition).split(/\s+/).map((key, index) => {
    if (key === '+') {
      return ' + '
    } else {
      const formattedKey = key.replace(/^PlatMod$/, platformModifierKey)
        .replace(/^Cmd$/, '\u2318')
        .replace(/^Alt$/, isRunningOnMac ? '\u2325' : 'Alt')
        .replace(/^Shift/, '\u21e7')
        .replace(/^Key/, '')
      return <kbd key={`key${index}`}>{formattedKey}</kbd>
    }
  }).value()
}

/**
 * React component for handling hotkeys.
 */
export default class HotkeyHandler extends React.Component {
  /**
   * Constructor that binds the supplied actions to the key combinations.
   *
   * @param {Object} props properties of the react component
   * @property {Array<Object>} hotkeys Array containing the desired hotkeys and actions
   */
  constructor (props) {
    super(props)

    this._handlingFocusChange = false
    this._root = undefined

    this.state = {
      dialogVisible: false,
      keyboardModifiers: {
        Alt: false,
        Control: false,
        Meta: false,
        Shift: false
      }
    }

    this.listeners = { down: {}, up: {} }

    this._handleFocusChange = this._handleFocusChange.bind(this)
    this._handleKey = this._handleKey.bind(this)
    this._handleKeyDown = this._handleKeyDown.bind(this)
    this._handleKeyUp = this._handleKeyUp.bind(this)
    this._setRoot = this._setRoot.bind(this)

    for (const hotkey of props.hotkeys) {
      this.addListener(hotkey.on, hotkey.keys, hotkey.action)
    }

    this._showDialog = this._showDialog.bind(this)
    this._hideDialog = this._hideDialog.bind(this)
    this._toggleDialog = this._toggleDialog.bind(this)

    this.addHelpListeners()
  }

  /**
   * Function for showing the help dialog.
   */
  _showDialog () {
    this.setState({ dialogVisible: true })
  }

  /**
   * Function for hiding the help dialog.
   */
  _hideDialog () {
    this.setState({ dialogVisible: false })
  }

  /**
   * Function for toggling the visibility of the help dialog.
   */
  _toggleDialog () {
    this.setState({ dialogVisible: !this.state.dialogVisible })
  }

  /**
   * Function for attaching the help dialog control listeners.
   */
  addHelpListeners () {
    this.addListener('down', '?', this._toggleDialog)
  }

  /**
   * Adding the actual event listeners and the approptiate handlers.
   */
  componentDidMount () {
    document.body.addEventListener('focus', this._handleFocusChange, true)
  }

  /**
   * Removing the event listeners.
   */
  componentWillUnmount () {
    document.body.removeEventListener('focus', this._handleFocusChange, true)
  }

  render () {
    const { hotkeys } = this.props
    const { dialogVisible, keyboardModifiers } = this.state

    const keysColumnStyle = { width: 120 }
    const actionColumnStyle = {}
    const actions = [
      <Button key='_close' color='primary' onClick={this._hideDialog}>Close</Button>
    ]

    const classString = [].concat(
      (keyboardModifiers.Alt ? ['key-alt'] : []),
      (keyboardModifiers.Control ? ['key-control'] : []),
      (keyboardModifiers.Meta ? ['key-meta'] : []),
      (keyboardModifiers.Shift ? ['key-shift'] : [])
    ).join(' ')

    return (
      <div ref={this._setRoot} className={classString}>
        <Dialog
          open={dialogVisible}
          onClose={this._hideDialog}
        >
          <DialogTitle>Hotkeys</DialogTitle>

          <DialogContent>
            <Table>
              <TableBody>
                {
                  hotkeys.map((hotkey, index) => (
                    <TableRow key={`hotkey_${index}`}>
                      <TableCell padding='dense' style={keysColumnStyle}>
                        {formatHotkeyDefinition(hotkey.keys)}
                      </TableCell>
                      <TableCell padding='dense' style={actionColumnStyle}>
                        {hotkey.description}
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </DialogContent>

          <DialogActions>{actions}</DialogActions>
        </Dialog>

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
    const hash = this._hotkeyToHash(keys)

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
    const hash = this._hotkeyToHash(keys)

    if (hash in this.listeners[on]) {
      _.pull(this.listeners[on][hash], action)
    }
  }

  /**
   * Proxy for keydown event.
   *
   * @param {KeyboardEvent} e the actual keyboard event
   */
  _handleKeyDown (e) {
    if (e.repeat) { return }

    if (e.key in this.state.keyboardModifiers) {
      this.setState(u({ keyboardModifiers: { [e.key]: true } }, this.state))
    } else {
      this._handleKey('down', e)
    }
  }

  /**
   * Proxy for keyup event.
   *
   * @param {KeyboardEvent} e the actual keyboard event
   */
  _handleKeyUp (e) {
    if (e.key in this.state.keyboardModifiers) {
      this.setState(u({ keyboardModifiers: { [e.key]: false } }, this.state))
    } else {
      this._handleKey('up', e)
    }
  }

  /**
   * Event handler function that looks for attached actions and executes them.
   *
   * @param {string} direction 'down' or 'up', on which event the action should be fired
   * @param {KeyboardEvent} e the actual keyboard event
   */
  _handleKey (direction, e) {
    const hashes = [
      (e.altKey ? 'Alt + ' : '') +
      (e.ctrlKey ? 'Ctrl + ' : '') +
      (e.shiftKey ? 'Shift + ' : '') +
      e.code,
      e.key
    ]

    if (e.ctrlKey || e.metaKey) {
      hashes.push(
        (e.altKey ? 'Alt + ' : '') +
        'PlatMod + ' +
        (e.shiftKey ? 'Shift + ' : '') +
        e.code,
        e.key
      )
    }

    for (const hash of hashes) {
      const listeners = this.listeners[direction]
      if (hash in listeners) {
        e.preventDefault()

        for (const callback of listeners[hash]) {
          callback()
        }
      }
    }
  }

  _handleFocusChange (e) {
    const whitelist = ['INPUT', 'TEXTAREA']

    if (this._handlingFocusChange) {
      // Prevent infinite recursion
      return
    }

    this._handlingFocusChange = true
    try {
      if (!_.includes(whitelist, e.target.tagName)) {
        document.querySelector('.ol-viewport').focus()
      }
    } finally {
      this._handlingFocusChange = false
    }
  }

  /**
   * Function for converting hotkey into uniform hash.
   *
   * @param {string} hotkey the key combination to activate the action
   *
   * @return {string} the unified hotkey identifier
   */
  _hotkeyToHash (hotkey) {
    return Hotkey.fromString(hotkey).toString()
  }

  _setRoot (root) {
    if (this._root === root) {
      return
    }

    if (this._root) {
      this._root.removeEventListener('keydown', this._handleKeyDown, true)
      this._root.removeEventListener('keyup', this._handleKeyUp, true)
    }

    this._root = root

    if (this._root) {
      this._root.addEventListener('keydown', this._handleKeyDown, true)
      this._root.addEventListener('keyup', this._handleKeyUp, true)
    }
  }
}

HotkeyHandler.condition = {
  Alt: e => e.altKey,
  Ctrl: e => e.ctrlKey,
  Meta: e => e.metaKey,
  PlatMod: e => isRunningOnMac ? e.metaKey : e.ctrlKey,
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

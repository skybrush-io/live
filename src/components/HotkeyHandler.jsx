/**
 * @file React Component for handling hotkeys.
 */

import React, { PropTypes } from 'react'
import _ from 'lodash'

import FlatButton from 'material-ui/FlatButton'
import Dialog from 'material-ui/Dialog'
import { Table, TableBody, TableHeader, TableHeaderColumn, TableRow,
  TableRowColumn } from 'material-ui/Table'

import { isRunningOnMac, platformModifierKey } from '../utils/platform'

/**
 * Formats the given hotkey definition string to make it suitable for
 * the user.
 *
 * This function replaces all occurrences of "Cmd" with the standard
 * "command" symbol on a Mac (i.e. Unicode code point U+2318). It also
 * replaces "PlatMod" with "Ctrl" on Windows and the "command" symbol
 * on a Mac, gets rid of the "Key" prefix and wraps each key in a
 * <code>&lt;kbd&gt;</code> tag.
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
         .replace(/^Cmd$/, '\u2318').replace(/^Key/, '')
      return <kbd key={`key${index}`}>{formattedKey}</kbd>
    }
  }).value()
}

/**
 * React Component for handling hotkeys.
 *
 * @param {Object} props properties of the react component
 * @property {Array<Object>} hotkeys Array containing the desired hotkeys and actions
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

    this.state = {
      dialogVisible: false
    }

    this.listeners = { down: {}, up: {} }

    this.handleKey_ = this.handleKey_.bind(this)
    this.handleKeyDown_ = this.handleKeyDown_.bind(this)
    this.handleKeyUp_ = this.handleKeyUp_.bind(this)

    for (const hotkey of props.hotkeys) {
      this.addListener(hotkey.on, hotkey.keys, hotkey.action)
    }

    this.showDialog_ = this.showDialog_.bind(this)
    this.hideDialog_ = this.hideDialog_.bind(this)
    this.toggleDialog_ = this.toggleDialog_.bind(this)

    this.addHelpListeners()
  }

  /**
   * Function for showing the help dialog.
   */
  showDialog_ () {
    this.setState({ dialogVisible: true })
  }

  /**
   * Function for hiding the help dialog.
   */
  hideDialog_ () {
    this.setState({ dialogVisible: false })
  }

  /**
   * Function for toggling the visibility of the help dialog.
   */
  toggleDialog_ () {
    this.setState({ dialogVisible: !this.state.dialogVisible })
  }

  /**
   * Function for attaching the help dialog control listeners.
   */
  addHelpListeners () {
    this.addListener('down', '?', this.toggleDialog_)
  }

  /**
   * Adding the actual event listeners and the approptiate handlers.
   */
  componentDidMount () {
    this.refs.capture.addEventListener('keydown', this.handleKeyDown_, true)
    this.refs.capture.addEventListener('keyup', this.handleKeyUp_, true)

    document.body.addEventListener('focus', this.handleFocusChange_, true)
  }

  /**
   * Removing the event listeners.
   */
  componentWillUnmount () {
    this.refs.capture.removeEventListener('keydown', this.handleKeyDown_, true)
    this.refs.capture.removeEventListener('keyup', this.handleKeyUp_, true)

    document.body.removeEventListener('focus', this.handleFocusChange_, true)
  }

  render () {
    const eventColumnStyle = {width: '35px'}
    const keysColumnStyle = {width: '150px'}
    const actionColumnStyle = {}
    const actions = [
      <FlatButton label="Close" primary={true}
        onTouchTap={this.hideDialog_} />
    ]

    return (
      <div ref="capture">
        <Dialog
          title="Hotkeys"
          actions={actions}
          open={this.state.dialogVisible}
          onRequestClose={this.hideDialog_}
          autoScrollBodyContent={true}
        >
          <Table selectable={false}>
            <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
              <TableRow>
                <TableHeaderColumn style={eventColumnStyle}>
                  Event
                </TableHeaderColumn>
                <TableHeaderColumn style={keysColumnStyle}>
                  Keys
                </TableHeaderColumn>
                <TableHeaderColumn style={actionColumnStyle}>
                  Action
                </TableHeaderColumn>
              </TableRow>
            </TableHeader>
            <TableBody displayRowCheckbox={false}>
              {
                this.props.hotkeys.map((hotkey, index) => (
                  <TableRow key={`hotkey_${index}`}>
                    <TableRowColumn style={eventColumnStyle}>
                      {hotkey.on}
                    </TableRowColumn>
                    <TableRowColumn style={keysColumnStyle}>
                      {formatHotkeyDefinition(hotkey.keys)}
                    </TableRowColumn>
                    <TableRowColumn style={actionColumnStyle}>
                      {hotkey.description}
                    </TableRowColumn>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
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
   * Proxy for keydown event.
   *
   * @param {KeyboardEvent} e the actual keyboard event
   */
  handleKeyDown_ (e) { this.handleKey_('down', e) }

  /**
   * Proxy for keyup event.
   *
   * @param {KeyboardEvent} e the actual keyboard event
   */
  handleKeyUp_ (e) { this.handleKey_('up', e) }

  /**
   * Event handler function that looks for attached actions and executes them.
   *
   * @param {string} direction 'down' or 'up', on which event the action should be fired
   * @param {KeyboardEvent} e the actual keyboard event
   */
  handleKey_ (direction, e) {
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
        if (e.repeat) { return }

        for (const callback of listeners[hash]) {
          callback()
        }
      }
    }
  }

  handleFocusChange_ (e) {
    let whitelist = ['INPUT', 'TEXTAREA']

    if (!_.includes(whitelist, e.target.tagName)) {
      document.querySelector('.ol-viewport').focus()
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

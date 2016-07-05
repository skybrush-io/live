import React, {PropTypes} from 'react'
import _ from 'lodash'

export default class HotkeyHandler extends React.Component {
  constructor (props) {
    super(props)

    this.listeners = {}

    this.handleKey_ = this.handleKey_.bind(this)

    for (const hotkey of props.hotkeys) {
      this.addListener(hotkey.keys, hotkey.action)
    }
  }

  componentDidMount () {
    this.refs.capture.addEventListener('keydown', this.handleKey_, true)
  }

  render () {
    return (
      <div ref="capture">
        {this.props.children}
      </div>
    )
  }

  addListener (hotkey, callback) {
    const hash = this.hotkeyToHash_(hotkey)

    if (!(hash in this.listeners)) {
      this.listeners[hash] = []
    }

    this.listeners[hash].push(callback)
  }

  removeListener (hotkey, callback) {
    const hash = this.hotkeyToHash_(hotkey)

    if (hash in this.listeners) {
      _.pull(this.listeners[hash], callback)
    }
  }

  handleKey_ (e) {
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
      if (hash in this.listeners) {
        e.preventDefault()
        for (const callback of this.listeners[hash]) {
          callback()
        }
      }
    }
  }

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

  toString () {
    // return this.modifiers.concat([this.key]).join(' + ')
    return [...this.modifiers, this.key].join(' + ')
  }
}

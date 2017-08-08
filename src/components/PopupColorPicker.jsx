import Color from 'color'
import React, { PropTypes } from 'react'
import { SketchPicker } from 'react-color'

export default class PopupColorPicker extends React.Component {
  constructor (props) {
    super(props)

    const { defaultValue } = this.props
    const initialColor = defaultValue ? {
      r: defaultValue.r,
      g: defaultValue.g,
      b: defaultValue.b,
      alpha: defaultValue.alpha !== undefined ? defaultValue.alpha : defaultValue.a
    } : {
      r: 255,
      g: 255,
      b: 255,
      alpha: 1.0
    }

    this.state = {
      open: false,
      color: initialColor
    }

    this._clickawayHandlerRegistered = false
    this._isMounted = false

    this._togglePicker = this._togglePicker.bind(this)
    this._registerClickawayHandlerIfNeeded =
      this._registerClickawayHandlerIfNeeded.bind(this)
    this._handleChange = this._handleChange.bind(this)
    this._handleClickAway = this._handleClickAway.bind(this)
  }

  componentDidMount () {
    this._isMounted = true
    this._registerClickawayHandlerIfNeeded()
  }

  componentWillUnmount () {
    this._isMounted = false
    this._registerClickawayHandlerIfNeeded()
  }

  render () {
    this._registerClickawayHandlerIfNeeded()

    const pickerStyle = Object.assign({
      position: 'absolute',
      overflow: 'hidden',
      zIndex: '2',
      transition: 'height 0.3s'
    }, this.state.open
    ? {
      height: 298
    }
    : {
      height: 0
    })

    const { color } = this.state
    const colorForPicker = {
      r: color.r,
      g: color.g,
      b: color.b,
      a: color.alpha
    }

    return (
      <div className={'popup-color-picker'} ref={'pickerContainer'}>
        <div className={'popup-color-picker-button'}
          style={Object.assign({},
            this.props.style,
            {
              backgroundColor: Color(color).rgb().string()
            }
          )}
          onClick={this._togglePicker}
         />

        <div className={'popup-color-picker-dropdown'} style={pickerStyle}>
          <SketchPicker
            color={colorForPicker}
            onChange={this._handleChange} />
        </div>
      </div>
    )
  }

  _registerClickawayHandlerIfNeeded () {
    const needsHandler = this._isMounted && this.state.open

    if (needsHandler && !this._clickawayHandlerRegistered) {
      document.addEventListener('click', this._handleClickAway, true)
      this._clickawayHandlerRegistered = true
    } else if (!needsHandler && this._clickawayHandlerRegistered) {
      document.removeEventListener('click', this._handleClickAway, true)
      this._clickawayHandlerRegistered = false
    }
  }

  _togglePicker () {
    this.setState({ open: !this.state.open })
  }

  _handleChange (color) {
    const colorInState = {
      r: color.rgb.r,
      g: color.rgb.b,
      b: color.rgb.b,
      alpha: color.rgb.a
    }
    this.setState({ color: colorInState })
  }

  _handleClickAway (e) {
    const { pickerContainer } = this.refs
    if (pickerContainer && !pickerContainer.contains(e.target)) {
      this._togglePicker()
      e.preventDefault()
      e.stopPropagation()
    }
  }

  getValue () {
    return this.state.color
  }
}

PopupColorPicker.propTypes = {
  style: PropTypes.object,
  defaultValue: PropTypes.object
}

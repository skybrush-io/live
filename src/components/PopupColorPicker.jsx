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

    this.clickawayHandlerRegistered_ = false
    this.isMounted_ = false

    this.togglePicker_ = this.togglePicker_.bind(this)
    this.registerClickawayHandlerIfNeeded_ =
      this.registerClickawayHandlerIfNeeded_.bind(this)
    this.handleChange_ = this.handleChange_.bind(this)
    this.handleClickAway_ = this.handleClickAway_.bind(this)
  }

  componentDidMount () {
    this.isMounted_ = true
    this.registerClickawayHandlerIfNeeded_()
  }

  componentWillUnmount () {
    this.isMounted_ = false
    this.registerClickawayHandlerIfNeeded_()
  }

  render () {
    this.registerClickawayHandlerIfNeeded_()

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
          onClick={this.togglePicker_}
         />

        <div className={'popup-color-picker-dropdown'} style={pickerStyle}>
          <SketchPicker
            color={colorForPicker}
            onChange={this.handleChange_} />
        </div>
      </div>
    )
  }

  registerClickawayHandlerIfNeeded_ () {
    const needsHandler = this.isMounted_ && this.state.open

    if (needsHandler && !this.clickawayHandlerRegistered_) {
      document.addEventListener('click', this.handleClickAway_, true)
      this.clickawayHandlerRegistered_ = true
    } else if (!needsHandler && this.clickawayHandlerRegistered_) {
      document.removeEventListener('click', this.handleClickAway_, true)
      this.clickawayHandlerRegistered_ = false
    }
  }

  togglePicker_ () {
    this.setState({ open: !this.state.open })
  }

  handleChange_ (color) {
    const colorInState = {
      r: color.rgb.r,
      g: color.rgb.b,
      b: color.rgb.b,
      alpha: color.rgb.a
    }
    this.setState({ color: colorInState })
  }

  handleClickAway_ (e) {
    const { pickerContainer } = this.refs
    if (pickerContainer && !pickerContainer.contains(e.target)) {
      this.togglePicker_()
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

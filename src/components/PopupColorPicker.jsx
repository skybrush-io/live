import React, { PropTypes } from 'react'
import { CompactPicker } from 'react-color'

export default class PopupColorPicker extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      open: false,
      color: this.props.defaultValue
    }

    this.togglePicker_ = this.togglePicker_.bind(this)
    this.handleChange_ = this.handleChange_.bind(this)
  }

  render () {
    const pickerStyle = Object.assign({
      position: 'absolute',
      overflow: 'hidden',
      zIndex: '2',
      transition: 'height 0.3s'
    }, this.state.open
    ? {
      height: 87
    }
    : {
      height: 0
    })

    const color = this.state.color

    return (
      <div className="popup-color-picker">
        <div className="popup-color-picker-button" style={Object.assign({},
          this.props.style,
          {
            backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
          }
        )}
          onClick={this.togglePicker_}
        ></div>

        <div className="popup-color-picker-dropdown" style={pickerStyle}>
          <CompactPicker
            color={this.state.color}
            onChange={this.handleChange_} />
        </div>
      </div>
    )
  }

  togglePicker_ () {
    this.setState({ open: !this.state.open })
  }

  handleChange_ (color) {
    this.setState({ color: color.rgb, open: false })
  }

  getValue () {
    return this.state.color
  }
}

PopupColorPicker.propTypes = {
  style: PropTypes.object,
  defaultValue: PropTypes.object
}

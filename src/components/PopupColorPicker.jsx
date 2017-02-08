import React, { PropTypes } from 'react'
import { SketchPicker } from 'react-color'

export default class PopupColorPicker extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      open: false,
      color: this.props.defaultValue
    }

    this.togglePicker_ = this.togglePicker_.bind(this)
    this.handleChange_ = this.handleChange_.bind(this)
    this.handleClickAway_ = this.handleClickAway_.bind(this)
  }

  render () {
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

    const color = this.state.color

    return (
      <div className={'popup-color-picker'} ref={'pickerContainer'}>
        <div className={'popup-color-picker-button'}
          style={Object.assign({},
            this.props.style,
            {
              backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
            }
          )}
          onClick={this.togglePicker_}
         />

        <div className={'popup-color-picker-dropdown'} style={pickerStyle}>
          <SketchPicker
            color={this.state.color}
            onChange={this.handleChange_} />
        </div>
      </div>
    )
  }

  togglePicker_ () {
    if (!this.state.open) {
      document.addEventListener('click', this.handleClickAway_, true)
    } else {
      document.removeEventListener('click', this.handleClickAway_, true)
    }

    this.setState({ open: !this.state.open })
  }

  handleChange_ (color) {
    this.setState({ color: color.rgb })
  }

  handleClickAway_ (e) {
    if (!this.refs.pickerContainer.contains(e.target)) {
      this.togglePicker_()
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

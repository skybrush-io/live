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
  }

  render () {
    const pickerStyle = Object.assign({
      position: 'absolute',
      overflow: 'hidden',
      zIndex: '2',
      transition: 'all 1s'
    }, this.state.open
    ? {
      width: '220px',
      height: '298px'
    }
    : {
      width: '0px',
      height: '0px'
    })

    const color = this.state.color

    return (
      <div style={{display: 'inline-block', verticalAlign: 'middle'}}>
        <div style={Object.assign({},
          this.props.style,
          {backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`}
        )}
          onClick={this.togglePicker_}
        ></div>

        <div style={pickerStyle}>
          <SketchPicker
            color={this.state.color}
            onChange={this.handleChange_} />
        </div>
      </div>
    )
  }

  togglePicker_ () {
    this.setState({open: !this.state.open})
  }

  handleChange_ (color) {
    this.setState({color: color.rgb})
  }

  getValue () {
    return this.state.color
  }
}

PopupColorPicker.propTypes = {
  style: PropTypes.object,
  defaultValue: PropTypes.object
}

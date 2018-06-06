import { isEqual } from 'lodash'
import TextField from '@material-ui/core/TextField'
import PropTypes from 'prop-types'
import React from 'react'

import { formatCoordinate, parseCoordinate } from '../utils/geography'

const safelyFormatCoordinate = coordinate => (
  coordinate !== undefined && coordinate !== null
    ? formatCoordinate(coordinate)
    : ''
)

export class CoordinateField extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      error: undefined,
      text: safelyFormatCoordinate(props.value)
    }
    this.state.originalText = this.state.text

    this._onChange = this._onChange.bind(this)
    this._onMaybeCommitValue = this._onMaybeCommitValue.bind(this)
  }

  static getDerivedStateFromProps (props, state) {
    return {
      originalText: safelyFormatCoordinate(props.value)
    }
  }

  render () {
    const { value, onChange, ...rest } = this.props
    const { error, text } = this.state
    return (
      <TextField value={text}
        error={!!error}
        onBlur={this._onMaybeCommitValue}
        onChange={this._onChange}
        {...rest} />
    )
  }

  _onChange (event) {
    const { value } = event.target
    this.setState({ text: value })
    this._validate(value)
  }

  _onMaybeCommitValue (event) {
    const [valid, parsed] = this._validate()
    if (valid) {
      const { onChange, value } = this.props
      if (isEqual(value, parsed)) {
        // Value did not change so we simply reset the text
        this._reset()
      } else if (onChange) {
        // Value changed, let's call the callback to see what to do now
        onChange(parsed)
      }
    }
  }

  _reset () {
    this.setState({ text: this.state.originalText })
  }

  _validate (value) {
    const { required } = this.props

    if (value === undefined) {
      value = this.state.text
    }

    const parsed = parseCoordinate(value)
    const hasError = ((value !== '' || required) && parsed === undefined)
    this.setState({
      error: hasError ? 'Not a valid coordinate' : undefined
    })

    return [!hasError, parsed]
  }
}

CoordinateField.propTypes = {
  onChange: PropTypes.func,
  required: PropTypes.bool,
  value: PropTypes.arrayOf(PropTypes.number)
}
CoordinateField.defaultProps = {
  required: false,
  value: undefined
}

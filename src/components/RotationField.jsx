/**
 * @file React component to display and adjust an angle in degrees.
 */

import PropTypes from 'prop-types';
import React from 'react';

import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '@material-ui/core/TextField';
import Clear from '@material-ui/icons/Clear';

import { normalizeAngle } from '~/utils/geography';

export const formatAngle = angle =>
  normalizeAngle(angle).replace(',', '.') + '\u00B0';

/**
 * React component to display and adjust an angle in degrees.
 */
export default class RotationField extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    value: PropTypes.number
  };

  static defaultProps = {
    value: undefined
  };

  constructor(props) {
    super(props);

    this.state = {
      error: undefined,
      text: formatAngle(props.value)
    };
    this.state.originalText = this.state.text;

    this._onChange = this._onChange.bind(this);
    this._onClearField = this._onClearField.bind(this);
    this._onMaybeCommitValue = this._onMaybeCommitValue.bind(this);
    this._onMouseDownOnButton = this._onMouseDownOnButton.bind(this);
  }

  static getDerivedStateFromProps(props) {
    return {
      originalText: formatAngle(props.value)
    };
  }

  componentWillUnmount() {
    this._onMaybeCommitValue(/* mounted = */ false);
  }

  render() {
    const { onChange, value, ...rest } = this.props;
    const { error, text } = this.state;
    const endAdornment = text ? (
      <InputAdornment position="end">
        <IconButton
          aria-label="Clear field"
          tabIndex={-1}
          onClick={this._onClearField}
          onMouseDown={this._onMouseDownOnButton}
        >
          <Clear />
        </IconButton>
      </InputAdornment>
    ) : null;

    return (
      <TextField
        error={Boolean(error)}
        value={text}
        InputProps={{ endAdornment }}
        onBlur={this._onMaybeCommitValue}
        onChange={this._onChange}
        {...rest}
      />
    );
  }

  _onChange(event) {
    const { value } = event.target;
    this.setState({ text: value });
    this._validate(value);
  }

  _onClearField() {
    this.setState({ text: '0' });
    this._validate('0');
    this._onMaybeCommitValue(true, '0');
  }

  _onMaybeCommitValue(mounted = true, value = undefined) {
    const [valid, parsed] = this._validate(value);
    if (valid) {
      const { onChange, value } = this.props;
      if (value === parsed) {
        // Value did not change so we simply reset the text if we are still
        // mounted
        if (mounted) {
          this._reset();
        }
      } else {
        if (onChange) {
          // Value changed, let's call the callback to see what to do now
          onChange(parsed);
        }

        this._updateTextFromValue(parsed);
      }
    }
  }

  _onMouseDownOnButton(event) {
    event.preventDefault();
  }

  _reset() {
    this.setState(state => ({ text: state.originalText }));
  }

  _updateTextFromValue(value) {
    if (value === undefined) {
      value = this.props.value;
    }

    this.setState({ text: formatAngle(value) });
  }

  _validate(value) {
    if (value === undefined) {
      value = this.state.text;
    }

    const parsed = normalizeAngle(Number.parseFloat(value));
    const hasError = isNaN(parsed);
    this.setState({
      error: hasError ? 'Not a valid angle' : undefined
    });

    return [!hasError, parsed];
  }
}

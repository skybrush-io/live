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

export const formatAngle = (angle) =>
  normalizeAngle(angle).replace(',', '.') + '°';

/**
 * React component to display and adjust an angle in degrees.
 */
export default class RotationField extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  };

  static defaultProps = {
    value: undefined,
  };

  static getDerivedStateFromProps(props) {
    return {
      originalText: formatAngle(props.value),
    };
  }

  state = {
    dirty: false,
    error: undefined,
    originalText: undefined,
    text: undefined,
  };

  componentWillUnmount() {
    const { dirty, originalText, text } = this.state;
    const shownText = dirty ? text : originalText;
    this._onMaybeCommitValue({ mounted: false, text: shownText });
  }

  render() {
    const { onChange, value, ...rest } = this.props;
    const { dirty, error, originalText, text } = this.state;
    const shownText = dirty ? text : originalText;
    const endAdornment = shownText ? (
      <InputAdornment position='end'>
        <IconButton
          aria-label='Clear field'
          edge='end'
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
        value={shownText}
        InputProps={{ endAdornment }}
        onBlur={this._onBlur}
        onChange={this._onChange}
        onKeyDown={this._onKeyDown}
        {...rest}
      />
    );
  }

  _onBlur = (event) => {
    this._onMaybeCommitValue({ text: event.target.value });
  };

  _onChange = (event) => {
    this._updateValueFromText(event.target.value);
  };

  _onClearField = () => {
    this._updateValueFromText('0', { commit: true });
  };

  _onKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      this._updateValueFromText(event.target.value, { commit: true });
    }
  };

  _onMaybeCommitValue = ({ mounted = true, text }) => {
    const [valid, parsed] = this._validate(text);
    if (valid) {
      const { onChange, value } = this.props;
      if (onChange && value !== parsed) {
        onChange(parsed);
      }

      // If we are still unmounted, mark ourselves as not dirty
      if (mounted) {
        this._reset();
      }
    }
  };

  _onMouseDownOnButton = (event) => {
    event.preventDefault();
  };

  _reset = () => {
    this.setState({ dirty: false, text: undefined });
  };

  _updateValueFromText = (text, { commit } = {}) => {
    this.setState((state) =>
      text === state.originalText
        ? { dirty: false, text: undefined }
        : { dirty: true, text }
    );

    if (commit) {
      this._onMaybeCommitValue({ text, mounted: true });
    } else {
      this._validate(text);
    }
  };

  _validate = (text) => {
    const value = Number.parseFloat(text);
    const hasError = Number.isNaN(value);
    this.setState({
      error: hasError ? 'Not a valid angle' : undefined,
    });

    return [!hasError, normalizeAngle(value)];
  };
}

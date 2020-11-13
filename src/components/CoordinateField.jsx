import isEqual from 'lodash-es/isEqual';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Clear from '@material-ui/icons/Clear';
import PropTypes from 'prop-types';
import React from 'react';

import { parseCoordinate, safelyFormatCoordinate } from '~/utils/geography';

export default class CoordinateField extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    required: PropTypes.bool,
    value: PropTypes.arrayOf(PropTypes.number),
  };

  static defaultProps = {
    required: false,
    value: undefined,
  };

  static getDerivedStateFromProps(props) {
    return {
      originalText: safelyFormatCoordinate(props.value),
    };
  }

  state = {
    dirty: false,
    error: undefined,
    originalText: undefined,
    text: undefined,
  };

  componentWillUnmount() {
    if (this.state.dirty) {
      this._onMaybeCommitValue({ text: this.state.text, mounted: false });
    }
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
        value={shownText}
        error={Boolean(error)}
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
    this._updateValueFromText('', { commit: true });
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
      if (onChange && !isEqual(value, parsed)) {
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
    const { required } = this.props;

    const value = parseCoordinate(text);
    const hasError = (text !== '' || required) && value === undefined;
    this.setState({
      error: hasError ? 'Not a valid coordinate' : undefined,
    });

    return [!hasError, value];
  };
}

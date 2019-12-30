import isEqual from 'lodash-es/isEqual';
import InputAdornment from '@material-ui/core/InputAdornment';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Clear from '@material-ui/icons/Clear';
import PropTypes from 'prop-types';
import React from 'react';

import { formatCoordinate, parseCoordinate } from '../utils/geography';

const safelyFormatCoordinate = coordinate =>
  coordinate !== undefined && coordinate !== null
    ? formatCoordinate(coordinate)
    : '';

export default class CoordinateField extends React.Component {
  static propTypes = {
    onChange: PropTypes.func,
    required: PropTypes.bool,
    value: PropTypes.arrayOf(PropTypes.number)
  };

  static defaultProps = {
    required: false,
    value: undefined
  };

  constructor(props) {
    super(props);

    this.state = {
      error: undefined,
      text: safelyFormatCoordinate(props.value)
    };
    this.state.originalText = this.state.text;

    this._onChange = this._onChange.bind(this);
    this._onClearField = this._onClearField.bind(this);
    this._onMaybeCommitValue = this._onMaybeCommitValue.bind(this);
    this._onMouseDownOnButton = this._onMouseDownOnButton.bind(this);
  }

  static getDerivedStateFromProps(props) {
    return {
      originalText: safelyFormatCoordinate(props.value)
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
        value={text}
        error={Boolean(error)}
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
    this.setState({ text: '' });
    this._validate('');
    this._onMaybeCommitValue(true, '');
  }

  _onMaybeCommitValue(mounted = true, value = undefined) {
    const [valid, parsed] = this._validate(value);
    if (valid) {
      const { onChange, value } = this.props;
      if (isEqual(value, parsed)) {
        // Value did not change so we simply reset the text if we are still
        // mounted
        if (mounted) {
          this._reset();
        }
      } else if (onChange) {
        // Value changed, let's call the callback to see what to do now
        onChange(parsed);
      }
    }
  }

  _onMouseDownOnButton(event) {
    event.preventDefault();
  }

  _reset() {
    this.setState(state => ({ text: state.originalText }));
  }

  _validate(value) {
    const { required } = this.props;

    if (value === undefined) {
      value = this.state.text;
    }

    const parsed = parseCoordinate(value);
    const hasError = (value !== '' || required) && parsed === undefined;
    this.setState({
      error: hasError ? 'Not a valid coordinate' : undefined
    });

    return [!hasError, parsed];
  }
}

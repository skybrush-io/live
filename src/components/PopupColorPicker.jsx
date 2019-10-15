import Color from 'color';
import PropTypes from 'prop-types';
import React from 'react';
import { SketchPicker } from 'react-color';

const toPicker = ({ r, g, b, alpha }) => ({ r, g, b, a: alpha });
const fromPicker = ({ r, g, b, a }) => ({ r, g, b, alpha: a });

export default class PopupColorPicker extends React.Component {
  constructor(props) {
    super(props);

    const { defaultValue, value } = this.props;

    this.state = {
      open: false,
      color: value || defaultValue || { r: 255, g: 255, b: 255, alpha: 1 }
    };

    this._clickawayHandlerRegistered = false;
    this._isMounted = false;

    this._setPickerContainerRef = this._setPickerContainerRef.bind(this);

    this._togglePicker = this._togglePicker.bind(this);
    this._registerClickawayHandlerIfNeeded = this._registerClickawayHandlerIfNeeded.bind(
      this
    );
    this._handleChange = this._handleChange.bind(this);
    this._handleClickAway = this._handleClickAway.bind(this);
  }

  componentDidMount() {
    this._isMounted = true;
    this._registerClickawayHandlerIfNeeded();
  }

  componentWillUnmount() {
    this._isMounted = false;
    this._registerClickawayHandlerIfNeeded();
  }

  _setPickerContainerRef(ref) {
    this._pickerContainer = ref;
  }

  render() {
    this._registerClickawayHandlerIfNeeded();

    const pickerStyle = {
      position: 'absolute',
      overflow: 'hidden',
      zIndex: '2',
      transition: 'height 0.3s',
      height: this.state.open ? 298 : 0
    };

    const { color } = this.state;

    return (
      <div ref={this._setPickerContainerRef} className="popup-color-picker">
        <div
          className="popup-color-picker-button"
          style={{
            ...this.props.style,
            backgroundColor: Color(color)
              .rgb()
              .string()
          }}
          onClick={this._togglePicker}
        />

        <div className="popup-color-picker-dropdown" style={pickerStyle}>
          <SketchPicker color={toPicker(color)} onChange={this._handleChange} />
        </div>
      </div>
    );
  }

  _registerClickawayHandlerIfNeeded() {
    const needsHandler = this._isMounted && this.state.open;

    if (needsHandler && !this._clickawayHandlerRegistered) {
      document.addEventListener('click', this._handleClickAway, true);
      this._clickawayHandlerRegistered = true;
    } else if (!needsHandler && this._clickawayHandlerRegistered) {
      document.removeEventListener('click', this._handleClickAway, true);
      this._clickawayHandlerRegistered = false;
    }
  }

  _togglePicker() {
    this.setState({ open: !this.state.open });
  }

  _handleChange(color) {
    const newColor = fromPicker(color.rgb);

    this.setState({ color: newColor });

    if (this.props.onChange) {
      this.props.onChange(newColor);
    }
  }

  _handleClickAway(e) {
    if (this._pickerContainer && !this._pickerContainer.contains(e.target)) {
      this._togglePicker();
      e.preventDefault();
      e.stopPropagation();
    }
  }

  getValue() {
    return this.state.color;
  }
}

PopupColorPicker.propTypes = {
  defaultValue: PropTypes.object,
  onChange: PropTypes.func,
  style: PropTypes.object,
  value: PropTypes.object
};

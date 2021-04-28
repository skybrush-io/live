import createColor from 'color';
import PropTypes from 'prop-types';
import React from 'react';
import { SketchPicker } from 'react-color';

const toPicker = ({ r, g, b, alpha }) => ({ r, g, b, a: alpha });
const fromPicker = ({ r, g, b, a }) => ({ r, g, b, alpha: a });

export default class PopupColorPicker extends React.Component {
  static propTypes = {
    defaultValue: PropTypes.object,
    onChange: PropTypes.func,
    style: PropTypes.object,
    value: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this._clickawayHandlerRegistered = false;
    this._isMounted = false;
    this._pickerContainerRef = React.createRef();

    this.state = {
      open: false,
      color: props.value ||
        props.defaultValue || { r: 255, g: 255, b: 255, alpha: 1 },
    };
  }

  componentDidMount() {
    this._isMounted = true;
    this._registerClickawayHandlerIfNeeded();
  }

  componentDidUpdate() {
    this._registerClickawayHandlerIfNeeded();
  }

  componentWillUnmount() {
    this._isMounted = false;
    this._registerClickawayHandlerIfNeeded();
  }

  render() {
    const pickerStyle = {
      position: 'absolute',
      overflow: 'hidden',
      zIndex: '2',
      transition: 'height 0.3s',
      height: this.state.open ? 298 : 0,
    };

    const { color } = this.state;

    return (
      <div ref={this._pickerContainerRef} className='popup-color-picker'>
        <div
          className='popup-color-picker-button'
          style={{
            ...this.props.style,
            backgroundColor: createColor(color).rgb().string(),
          }}
          onClick={this._togglePicker}
        />

        <div className='popup-color-picker-dropdown' style={pickerStyle}>
          <SketchPicker color={toPicker(color)} onChange={this._handleChange} />
        </div>
      </div>
    );
  }

  _registerClickawayHandlerIfNeeded = () => {
    const needsHandler = this._isMounted && this.state.open;

    if (needsHandler && !this._clickawayHandlerRegistered) {
      document.addEventListener('click', this._handleClickAway, true);
      this._clickawayHandlerRegistered = true;
    } else if (!needsHandler && this._clickawayHandlerRegistered) {
      document.removeEventListener('click', this._handleClickAway, true);
      this._clickawayHandlerRegistered = false;
    }
  };

  _togglePicker = () => {
    this.setState((state) => ({
      open: !state.open,
    }));
  };

  _handleChange = (color) => {
    const newColor = fromPicker(color.rgb);

    this.setState({ color: newColor });

    if (this.props.onChange) {
      this.props.onChange(newColor);
    }
  };

  _handleClickAway = (event) => {
    if (
      this._pickerContainerRef.current &&
      !this._pickerContainerRef.current.contains(event.target)
    ) {
      this._togglePicker();
      event.preventDefault();
      event.stopPropagation();
    }
  };
}

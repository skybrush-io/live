/**
 * @file React Component to display and adjust the rotation of the map view.
 */

import throttle from 'lodash-es/throttle';
import { easeOut } from 'ol/easing';
import PropTypes from 'prop-types';
import React from 'react';
import { Translation } from 'react-i18next';

import { withMap } from '@collmot/ol-react';

import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import RotateLeft from '@material-ui/icons/RotateLeft';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import { normalizeAngle } from '~/utils/geography';
import { toDegrees, toRadians } from '~/utils/math';

/** @import Map from 'ol/Map' */

/**
 * React Component to display and adjust the rotation of the map view.
 */
class MapRotationTextBox extends React.Component {
  static propTypes = {
    fieldWidth: PropTypes.string,
    map: PropTypes.object,
    resetDuration: PropTypes.number,
  };

  state = {
    isFocused: false,
    rotation: 0,
  };

  /**
   * Constructor that sets initial state, binds context to functions,
   * adds signal event handler and requests map reference.
   *
   * @param {Object} props properties of the react component
   * @param {string} props.fieldWidth the width of the actual input field
   * @param {Map} props.map the map on which the control appears
   * @param {number} props.resetDuration the amount of time the reset transition should take (in ms)
   */
  constructor(props) {
    super(props);

    this._updateRotationFromMapView = throttle(
      this._updateRotationFromMapView.bind(this),
      100
    );
    this._onFocus = this._onFocus.bind(this);
    this._onBlur = this._onBlur.bind(this);
    this._onChange = this._onChange.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onButtonClick = this._onButtonClick.bind(this);

    this.state.rotation = normalizeAngle(props.map.getView().getRotation());

    props.map.on('change:view', ({ target }) => {
      target.getView().on('change:rotation', this._updateRotationFromMapView);
    });
  }

  render() {
    return (
      <div style={{ marginRight: '12px' }}>
        <Translation>
          {(t) => (
            <Tooltip content={t('map.resetRotation')}>
              <IconButton onClick={this._onButtonClick}>
                <RotateLeft />
              </IconButton>
            </Tooltip>
          )}
        </Translation>
        <TextField
          size='small'
          style={{
            padding: '8px 0',
            width: this.props.fieldWidth,
          }}
          type='number'
          value={
            this.state.isFocused
              ? this.state.rotation
              : normalizeAngle(this.state.rotation)
          }
          variant='standard'
          onFocus={this._onFocus}
          onBlur={this._onBlur}
          onChange={this._onChange}
          onKeyDown={this._onKeyDown}
        />
      </div>
    );
  }

  /**
   * Event handler that processes and updates the state from the map.
   *
   * @param {ol.ObjectEvent} event the event fired from the OpenLayers View
   */
  _updateRotationFromMapView(event) {
    this.setState({
      rotation: toDegrees(-event.target.get('rotation')),
    });
  }

  /**
   * Event handler that sets the component's state according to the focus,
   * and normalizes it's value.
   */
  _onFocus() {
    this.setState((state) => ({
      isFocused: true,
      rotation: normalizeAngle(state.rotation),
    }));
  }

  /**
   * Event handler that unsets the component's focused state on blur.
   */
  _onBlur() {
    this.setState({
      isFocused: false,
    });
  }

  /**
   * Event handler that processes input from the TextField component.
   *
   * @param {Event} event the event fired from the TextField React component
   */
  _onChange(event) {
    // Maybe this should be done in componentWill/DidUpdate, but it causes feedback loop
    this.props.map.getView().setRotation(toRadians(-event.target.value));

    this.setState({
      rotation: event.target.value,
    });
  }

  /**
   * Function to normalize the field's value when Enter is pressed.
   *
   * @param {Event} event the event fired from the TextField React component
   */
  _onKeyDown(event) {
    if (event.key === 'Enter') {
      event.target.blur();
    }
  }

  /**
   * Event handler that resets the heading of the map to north
   *
   * @param {Event} event the event fired from the IconButton component
   */
  _onButtonClick() {
    this.props.map.getView().animate({
      rotation: 0,
      duration: this.props.resetDuration,
      easing: easeOut,
    });
  }
}

export default withMap(MapRotationTextBox);

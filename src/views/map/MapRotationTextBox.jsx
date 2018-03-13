/**
 * @file React Component to display and adjust the rotation of the map view.
 */

import Easing from 'ol/easing'
import PropTypes from 'prop-types'
import React from 'react'

import { mapReferenceRequestSignal, mapRotationResetSignal } from '../../signals'

import IconButton from 'material-ui/IconButton'
import ImageRotateRight from 'material-ui-icons/RotateRight'
import TextField from 'material-ui/TextField'

export const normalizeAngle = (angle) => (((angle % 360) + 360) % 360).toFixed(2)

/**
 * React Component to display and adjust the rotation of the map view.
 *
 * @param {Object} props properties of the react component
 * @property {number} resetDuration the amount of time the reset transition should take (in ms)
 * @property {string} fieldWidth the width of the actual input field
 * @property {string} style styling of the outermost element (a div)
 *
 * @emits {mapReferenceRequestSignal} requests map reference
 */
export default class MapRotationTextBox extends React.Component {
  /**
   * Constructor that sets initial state, binds context to functions,
   * adds signal event handler and requests map reference.
   *
   * @param {Object} props properties of the react component
   * @property {number} resetDuration the amount of time the reset transition should take (in ms)
   * @property {string} fieldWidth the width of the actual input field
   * @property {string} style styling of the outermost element (a div)
   *
   * @emits {mapReferenceRequestSignal} requests map reference
   */
  constructor (props) {
    super(props)
    this.state = {
      isFocused: false,
      rotation: 0
    }

    this._onMapReferenceReceived = this._onMapReferenceReceived.bind(this)
    this._updateFromMap = this._updateFromMap.bind(this)
    this._onFocus = this._onFocus.bind(this)
    this._onBlur = this._onBlur.bind(this)
    this._onChange = this._onChange.bind(this)
    this._onKeyDown = this._onKeyDown.bind(this)
    this._onButtonClick = this._onButtonClick.bind(this)

    mapRotationResetSignal.add(this._onButtonClick)

    mapReferenceRequestSignal.dispatch(this._onMapReferenceReceived)
  }

  render () {
    return (
      <div style={this.props.style}>
        <IconButton onClick={this._onButtonClick} tooltip='Reset rotation'>
          <ImageRotateRight />
        </IconButton>
        <TextField
          style={{
            width: this.props.fieldWidth
            // verticalAlign: 'text-bottom'
          }}
          type='number'
          value={
            this.state.isFocused
              ? this.state.rotation
              : normalizeAngle(this.state.rotation)
          }
          onFocus={this._onFocus}
          onBlur={this._onBlur}
          onChange={this._onChange}
          onKeyDown={this._onKeyDown} />
      </div>
    )
  }

  /**
   * Callback for receiving the map reference.
   * Attaches event handlers to the map and it's view.
   *
   * @param {ol.Map} map the map to attach the event handlers to
   */
  _onMapReferenceReceived (map) {
    this.map = map

    map.getView().on('propertychange', this._updateFromMap)

    map.on('propertychange', (e) => {
      if (e.key === 'view') {
        map.getView().on('propertychange', this._updateFromMap)
      }
    })
  }

  /**
   * Event handler that processes and updates the state from the map.
   *
   * @param {ol.ObjectEvent} e the event fired from the OpenLayers View
   */
  _updateFromMap (e) {
    if (e.key === 'rotation') {
      this.setState({
        rotation: -e.target.get('rotation') / (Math.PI / 180)
      })
    }
  }

  /**
   * Event handler that sets the component's state according to the focus,
   * and normalizes it's value.
   */
  _onFocus () {
    this.setState({
      isFocused: true,
      rotation: normalizeAngle(this.state.rotation)
    })
  }

  /**
   * Event handler that unsets the component's focused state on blur.
   */
  _onBlur () {
    this.setState({
      isFocused: false
    })
  }

  /**
   * Event handler that processes input from the TextField component.
   *
   * @param {Event} e the event fired from the TextField React component
   */
  _onChange (e) {
    // Maybe this should be done in componentWill/DidUpdate, but it causes feedback loop
    this.map.getView().setRotation(-e.target.value * (Math.PI / 180))

    this.setState({
      rotation: e.target.value
    })
  }

  /**
   * Function to normalize the field's value when Enter is pressed.
   *
   * @param {Event} e the event fired from the TextField React component
   */
  _onKeyDown (e) {
    if (e.key === 'Enter') {
      e.target.blur()
    }
  }

  /**
  * Event handler that resets the heading of the map to north
  *
  * @param {Event} e the event fired from the IconButton component
  */
  _onButtonClick (e) {
    this.map.getView().animate({
      rotation: 0,
      duration: this.props.resetDuration,
      easing: Easing.easeOut
    })
  }
}

MapRotationTextBox.propTypes = {
  resetDuration: PropTypes.number,
  fieldWidth: PropTypes.string,
  style: PropTypes.object
}

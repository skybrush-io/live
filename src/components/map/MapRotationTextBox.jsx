/**
 * @file React Component to display and adjust the rotation of the map view.
 */

import React, { PropTypes } from 'react'
import ol from 'openlayers'

import { mapReferenceRequestSignal, mapRotationResetSignal } from '../../signals'

import IconButton from 'material-ui/IconButton'
import ImageRotateRight from 'material-ui/svg-icons/image/rotate-right'
import TextField from 'material-ui/TextField'

const normalizeAngle = (angle) => (((angle % 360) + 360) % 360).toFixed(2)

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

    this.onMapReferenceReceived_ = this.onMapReferenceReceived_.bind(this)
    this.updateFromMap_ = this.updateFromMap_.bind(this)
    this.onFocus_ = this.onFocus_.bind(this)
    this.onBlur_ = this.onBlur_.bind(this)
    this.onChange_ = this.onChange_.bind(this)
    this.onKeyDown_ = this.onKeyDown_.bind(this)
    this.onButtonClick_ = this.onButtonClick_.bind(this)

    mapRotationResetSignal.add(this.onButtonClick_)

    mapReferenceRequestSignal.dispatch(this.onMapReferenceReceived_)
  }

  render () {
    return (
      <div style={this.props.style}>
        <IconButton onClick={this.onButtonClick_} tooltip={'Reset rotation'}>
          <ImageRotateRight />
        </IconButton>
        <TextField
          style={{ width: this.props.fieldWidth, verticalAlign: 'inherit' }}
          hintText={'Rotation'}
          type={'number'}
          value={
            this.state.isFocused
            ? this.state.rotation
            : normalizeAngle(this.state.rotation)
          }
          onFocus={this.onFocus_}
          onBlur={this.onBlur_}
          onChange={this.onChange_}
          onKeyDown={this.onKeyDown_} />
      </div>
    )
  }

  /**
   * Callback for receiving the map reference.
   * Attaches event handlers to the map and it's view.
   *
   * @param {ol.Map} map the map to attach the event handlers to
   */
  onMapReferenceReceived_ (map) {
    this.map = map

    map.getView().on('propertychange', this.updateFromMap_)

    map.on('propertychange', (e) => {
      if (e.key === 'view') {
        map.getView().on('propertychange', this.updateFromMap_)
      }
    })
  }

  /**
   * Event handler that processes and updates the state from the map.
   *
   * @param {ol.ObjectEvent} e the event fired from the OpenLayers View
   */
  updateFromMap_ (e) {
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
  onFocus_ () {
    this.setState({
      isFocused: true,
      rotation: normalizeAngle(this.state.rotation)
    })
  }

  /**
   * Event handler that unsets the component's focused state on blur.
   */
  onBlur_ () {
    this.setState({
      isFocused: false
    })
  }

  /**
   * Event handler that processes input from the TextField component.
   *
   * @param {Event} e the event fired from the TextField React component
   */
  onChange_ (e) {
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
  onKeyDown_ (e) {
    if (e.key === 'Enter') {
      e.target.blur()
    }
  }

  /**
  * Event handler that resets the heading of the map to north
  *
  * @param {Event} e the event fired from the IconButton component
  */
  onButtonClick_ (e) {
    const view = this.map.getView()

    this.map.beforeRender(ol.animation.rotate({
      rotation: view.getRotation(),
      duration: this.props.resetDuration,
      easing: ol.easing.easeOut
    }))

    view.setRotation(0)
  }
}

MapRotationTextBox.propTypes = {
  resetDuration: PropTypes.number,
  fieldWidth: PropTypes.string,
  style: PropTypes.object
}

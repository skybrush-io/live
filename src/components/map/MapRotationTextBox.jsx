/**
 * @file React Component to display and adjust the rotation of the map view.
 */

import React from 'react'
import ol from 'openlayers'

import Signal from 'mini-signals'

import IconButton from 'material-ui/IconButton'
import ImageRotateRight from 'material-ui/svg-icons/image/rotate-right'
import TextField from 'material-ui/TextField'

/**
 * React Component to display and adjust the rotation of the map view.
 *
 * @param {Object} props properties of the react component
 * @property {number} resetDuration the amount of time the reset transition should take (in ms)
 * @property {string} fieldWidth the width of the actual input field
 * @property {string} style styling of the outermost element (a div)
 * @property {Signal} mapReferenceRequestSignal Mini-signal for requesting the map reference.
 *
 * @emits {mapReferenceRequestSignal} requests map reference.
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
   * @property {Signal} mapReferenceRequestSignal Mini-signal for requesting the map reference.
   *
   * @emits {mapReferenceRequestSignal} requests map reference.
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
    this.handleChange_ = this.handleChange_.bind(this)
    this.handleClick_ = this.handleClick_.bind(this)

    props.mapReferenceRequestSignal.dispatch(this.onMapReferenceReceived_)
  }

  render () {
    return (
      <div style={this.props.style}>
        <IconButton onClick={this.handleClick_} tooltip="Reset rotation">
          <ImageRotateRight />
        </IconButton>
        <TextField
          style={{ width: this.props.fieldWidth, verticalAlign: 'inherit' }}
          hintText="Rotation"
          type="number"
          value={
            this.state.isFocused
            ? this.state.rotation
            : (this.state.rotation % 360).toFixed(2)
          }
          onFocus={this.onFocus_}
          onBlur={this.onBlur_}
          onChange={this.handleChange_} />
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
        rotation: e.target.get('rotation') / (Math.PI / 180)
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
      rotation: (this.state.rotation % 360).toFixed(2)
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
  handleChange_ (e) {
    // Maybe this should be done in componentWill/DidUpdate, but it causes feedback loop
    this.map.getView().setRotation(e.target.value * (Math.PI / 180))

    this.setState({
      rotation: e.target.value
    })
  }

  /**
  * Event handler that resets the heading of the map to north
  *
  * @param {Event} e the event fired from the IconButton component
  */
  handleClick_ (e) {
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
  resetDuration: React.PropTypes.number,
  fieldWidth: React.PropTypes.string,
  style: React.PropTypes.object,
  mapReferenceRequestSignal: React.PropTypes.instanceOf(Signal)
}

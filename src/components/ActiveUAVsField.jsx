/**
 * @file Autocompletion field that allows the user to select an active UAV
 * by typing its name or selecting it from the autocompletion dropdown.
 */

import { autobind } from 'core-decorators'
import _ from 'lodash'
import AutoComplete from 'material-ui/AutoComplete'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import { selectUAVInMessagesDialog } from '../actions/messages'
import Flock from '../model/flock'

import { focusMessagesDialogUAVSelectorField } from '../signals'

/**
 * Autocompletion field that allows the user to select a UAV by
 * typing its name or selecting it from the autocompletion dropdown.
 *
 * The set of UAV IDs accepted by the component is given in the props;
 * it is the duty of the user of this component to provide the appropriate
 * set of UAV IDs.
 */
export class UAVSelectorField extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      error: null,
      searchText: props.initialText
    }

    this._assignAutoCompleteFieldRef = value => { this._autoCompleteField = value }

    this._signalBinding = undefined
    this._autoCompleteField = undefined
  }

  componentDidMount () {
    this._signalBinding = focusMessagesDialogUAVSelectorField.add(
      this._selectAutoCompleteField
    )
  }

  componentWillUnmount () {
    focusMessagesDialogUAVSelectorField.detach(this._signalBinding)
  }

  /**
   * Validates the given value in the autocomplete field and calls
   * the {@link onValueChanged} handler if the new value is valid.
   *
   * @param {string} value  the value of the autocomplete field
   * @return {undefined}
   */
  _commitValueIfValid (value) {
    const { onValueChanged } = this.props
    if (this.validate(value) && onValueChanged) {
      if (value === '') {
        value = null
      }
      onValueChanged(value)
    }
  }

  render () {
    const { prompt, style, uavIds } = this.props
    const { error, searchText } = this.state
    return (
      <AutoComplete ref={this._assignAutoCompleteFieldRef}
        hintText={prompt} maxSearchResults={5}
        dataSource={uavIds} searchText={searchText} errorText={error}
        filter={AutoComplete.caseInsensitiveFilter}
        fullWidth style={style}
        onBlur={this._onBlur}
        onNewRequest={this._onNewRequest}
        onUpdateInput={this._onUpdateInput}
      />
    )
  }

  /**
   * Validates the value entered by the user and updates the error state
   * of the autocomplete field appropriately.
   *
   * @param  {string} value  the value entered by the user
   * @return {boolean} whether the value entered by the user passed the
   *         validation
   */
  validate (value) {
    let error = null
    if (!value) {
      // Value is empty
      if (!this.props.allowEmpty) {
        error = 'UAV ID must be specified'
      }
    } else if (!this._valueIsAmongUAVIds(value)) {
      // Value entered by the user is not in the list of UAV IDs
      error = 'No such UAV'
    } else {
      // Value is correct, nothing to do
    }
    this.setState({ error })
    return error == null
  }

  /**
   * Event handler that is called when the focus leaves the field.
   *
   * @param {FocusEvent} event  the focus event
   * @return {undefined}
   */
  @autobind
  _onBlur (event) {
    // TODO: don't try to commit the value if the related target is the
    // dropdown menu of the autocomplete dialog
    const chosenRequest = event.target.value
    this._commitValueIfValid(chosenRequest)
  }

  /**
   * Event handler that is called when the user selects an item from the
   * dropdown menu or commits the selection with Enter.
   *
   * @param {string}  chosenRequest  the value chosen by the user
   * @param {number}  index  the index of the value in the dropdown menu,
   *        if (and only if) the user selected the item in the dropdown
   *        menu. Note that it will be -1 if the user typed a value that
   *        happens to be the same as some item in the dropdown menu.
   * @return {undefined}
   */
  @autobind
  _onNewRequest (chosenRequest, index) {
    if (index === -1 && !this._valueIsAmongUAVIds(chosenRequest)) {
      // The user did not choose from the dropdown and the value that the
      // user typed does not match any of the items from the data source.
      // We can pretend that the user chose the first item from the menu.
      const { uavIds } = this.props
      const firstMatch = _.find(uavIds,
        uavId => AutoComplete.caseInsensitiveFilter(chosenRequest, uavId))
      if (firstMatch) {
        chosenRequest = firstMatch
      }
    }
    this._commitValueIfValid(chosenRequest)
  }

  /**
   * Event handler that is called when the user types into the field.
   *
   * @param {string}  searchText  the new text that the user typed
   */
  @autobind
  _onUpdateInput (searchText) {
    this.setState({ searchText })
  }

  /**
   * Returns whether the given value is among the valid UAV IDs accepted
   * by this component.
   *
   * @param {string} value  the value to test
   * @return {boolean} whether the given value is among the valid UAV IDs
   */
  _valueIsAmongUAVIds (value) {
    const { uavIds } = this.props
    return uavIds && uavIds.indexOf(value) >= 0
  }

  @autobind
  _selectAutoCompleteField () {
    if (!this._autoCompleteField) {
      console.warn('The autocomplete field has not registered yet.')
      return
    }

    this._autoCompleteField.refs.searchTextField.input.select()
  }
}

UAVSelectorField.propTypes = {
  allowEmpty: PropTypes.bool.isRequired,
  initialText: PropTypes.string,
  prompt: PropTypes.string.isRequired,
  style: PropTypes.object.isRequired,
  uavIds: PropTypes.arrayOf(PropTypes.string).isRequired,

  onValueChanged: PropTypes.func
}

UAVSelectorField.defaultProps = {
  allowEmpty: true,
  initialValue: '',
  prompt: 'UAV ID',
  style: {},
  uavIds: []
}

/**
 * Smart component that binds a UAVSelectorField to a {@link Flock} instance
 * such that the set of UAV IDs accepted by the field is always updated from
 * the flock when a new UAV appears or a UAV leaves the flock.
 */
export class ActiveUAVsFieldPresentation extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      uavIds: []
    }

    this._onUAVsAdded = this._onUAVsAdded.bind(this)
    this.eventBindings = {}
  }

  componentWillReceiveProps (newProps) {
    this._onFlockMaybeChanged(this.props.flock, newProps.flock)
  }

  componentDidMount () {
    this._onFlockMaybeChanged(undefined, this.props.flock)
  }

  componentWillUnmount () {
    this._onFlockMaybeChanged(this.props.flock, undefined)
  }

  /**
   * Function that is called when we suspect that the flock associated to
   * the field may have changed.
   *
   * This function subscribes to the events from the new flock and
   * unsubscribes from the events of the old flock. It also performs a
   * strict equality check on the two flocks because they may be equal.
   *
   * @param {Flock} oldFlock  the old flock associated to the layer
   * @param {Flock} newFlock  the new flock associated to the layer
   */
  _onFlockMaybeChanged (oldFlock, newFlock) {
    if (oldFlock === newFlock) {
      return
    }

    if (oldFlock) {
      oldFlock.uavsUpdated.detach(this.eventBindings.uavsAdded)
      delete this.eventBindings.uavsAdded
    }

    if (newFlock) {
      this.eventBindings.uavsAdded = newFlock.uavsAdded.add(this._onUAVsAdded)
    }

    this._updateUAVIdsFromFlock(newFlock)
  }

  /**
   * Event handler that is called when new UAVs have been added to the flock
   * and the allowed values in the field should be re-calculated.
   *
   * @listens Flock#uavsAdded
   * @param {UAV[]} uavs  the UAVs that should be refreshed
   */
  _onUAVsAdded (uavs) {
    this._updateUAVIdsFromFlock(this.props.flock)
  }

  render () {
    const { allowEmpty, prompt, style, value, onValueChanged } = this.props
    const { uavIds } = this.state
    return (
      <UAVSelectorField allowEmpty={allowEmpty} prompt={prompt}
        style={style} initialText={value} onValueChanged={onValueChanged}
        uavIds={uavIds} />
    )
  }

  /**
   * Updates the list of valid UAV IDs from the given flock.
   *
   * @param {Flock?} flock  the flock that the field was associated to
   */
  _updateUAVIdsFromFlock (flock) {
    this.setState({
      uavIds: flock ? flock.getAllUAVIds() : []
    })
  }
}

ActiveUAVsFieldPresentation.propTypes = {
  allowEmpty: PropTypes.bool.isRequired,
  flock: PropTypes.instanceOf(Flock),
  prompt: PropTypes.string.isRequired,
  style: PropTypes.object.isRequired,
  value: PropTypes.string.isRequired,

  onValueChanged: PropTypes.func
}

ActiveUAVsFieldPresentation.defaultProps = {
  allowEmpty: true,
  prompt: 'UAV ID',
  style: {},
  value: ''
}

/**
 * Smart component that binds an ActiveUAVsFieldPresentation component to
 * the Redux store.
 */
const ActiveUAVsField = connect(
  // stateToProps
  state => ({
    value: state.messages.selectedUAVId || ''
  }),
  // dispatchToProps
  dispatch => ({
    onValueChanged (value) {
      dispatch(selectUAVInMessagesDialog(value))
    }
  })
)(ActiveUAVsFieldPresentation)

export default ActiveUAVsField

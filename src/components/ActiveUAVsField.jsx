/**
 * @file Autocompletion field that allows the user to select an active UAV
 * by typing its name or selecting it from the autocompletion dropdown.
 */

import PropTypes from 'prop-types';
import React from 'react';

import { injectFlockFromContext } from '~/flock';
import Flock from '~/model/flock';

import { AutoComplete } from './AutoComplete';

/**
 * Autocompletion field that allows the user to select a UAV by
 * typing its name or selecting it from the autocompletion dropdown.
 *
 * The set of UAV IDs accepted by the component is given in the props;
 * it is the duty of the user of this component to provide the appropriate
 * set of UAV IDs.
 */
export class UAVSelectorField extends React.Component {
  static propTypes = {
    ...AutoComplete.propTypes,

    allowEmpty: PropTypes.bool,
    label: PropTypes.node,
    maxSearchResults: PropTypes.number,
    onValueChanged: PropTypes.func,
    uavIds: PropTypes.arrayOf(PropTypes.string),
  };

  static defaultProps = {
    allowEmpty: true,
    label: 'UAV ID',
    maxSearchResults: 5,
    uavIds: [],
  };

  render() {
    const { maxSearchResults, onValueChanged, uavIds, ...rest } = this.props;
    const fetchOptions = {
      caseSensitive: false,
      maxItems: maxSearchResults,
    };
    return (
      <AutoComplete
        fetchSuggestions={AutoComplete.makePrefixBasedFetcher(
          uavIds,
          fetchOptions
        )}
        validateValue={this.validate}
        onValueCommitted={onValueChanged}
        {...rest}
      />
    );
  }

  /**
   * Validates the value entered by the user and updates the error state
   * of the autocomplete field appropriately.
   *
   * @param  {string} value  the value entered by the user
   * @return {boolean} whether the value entered by the user passed the
   *         validation
   */
  validate = (value) => {
    if (!value) {
      // Value is empty
      if (!this.props.allowEmpty) {
        return 'UAV ID must be specified';
      }
    } else if (this._valueIsAmongUAVIds(value)) {
      // Value is correct, nothing to do
      return true;
    } else {
      // Value entered by the user is not in the list of UAV IDs
      return 'No such UAV';
    }
  };

  /**
   * Returns whether the given value is among the valid UAV IDs accepted
   * by this component.
   *
   * @param {string} value  the value to test
   * @return {boolean} whether the given value is among the valid UAV IDs
   */
  _valueIsAmongUAVIds(value) {
    const { uavIds } = this.props;
    return uavIds && uavIds.includes(value);
  }
}

/**
 * Smart component that binds a UAVSelectorField to a {@link Flock} instance
 * such that the set of UAV IDs accepted by the field is always updated from
 * the flock when a new UAV appears or a UAV leaves the flock.
 */
class ActiveUAVsField extends React.Component {
  static propTypes = {
    ...UAVSelectorField.propTypes,

    allowEmpty: PropTypes.bool,
    flock: PropTypes.instanceOf(Flock),
    label: PropTypes.node,
    value: PropTypes.string,
  };

  static defaultProps = {
    allowEmpty: true,
    label: 'UAV ID',
    value: '',
  };

  state = {
    uavIds: [],
  };

  constructor(props) {
    super(props);

    this._onUAVsAdded = this._onUAVsAdded.bind(this);
    this.eventBindings = {};
  }

  componentDidUpdate(previousProps) {
    this._onFlockMaybeChanged(previousProps.flock, this.props.flock);
  }

  componentDidMount() {
    this._onFlockMaybeChanged(undefined, this.props.flock);
  }

  componentWillUnmount() {
    this._onFlockMaybeChanged(this.props.flock, undefined);
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
  _onFlockMaybeChanged(oldFlock, newFlock) {
    if (oldFlock === newFlock) {
      return;
    }

    if (oldFlock) {
      oldFlock.uavsUpdated.detach(this.eventBindings.uavsAdded);
      delete this.eventBindings.uavsAdded;
    }

    if (newFlock) {
      this.eventBindings.uavsAdded = newFlock.uavsAdded.add(this._onUAVsAdded);
    }

    this._updateUAVIdsFromFlock(newFlock);
  }

  /**
   * Event handler that is called when new UAVs have been added to the flock
   * and the allowed values in the field should be re-calculated.
   *
   * @listens Flock#uavsAdded
   * @param {UAV[]} uavs  the UAVs that should be refreshed
   */
  _onUAVsAdded() {
    this._updateUAVIdsFromFlock(this.props.flock);
  }

  render() {
    const { flock, ...rest } = this.props;
    const { uavIds } = this.state;
    return <UAVSelectorField uavIds={uavIds} {...rest} />;
  }

  /**
   * Updates the list of valid UAV IDs from the given flock.
   *
   * @param {Flock?} flock  the flock that the field was associated to
   */
  _updateUAVIdsFromFlock(flock) {
    this.setState({
      uavIds: flock ? flock.getAllUAVIds() : [],
    });
  }
}

export default injectFlockFromContext(ActiveUAVsField);

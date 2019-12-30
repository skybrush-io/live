/**
 * @file Component for displaying UAV info in a tabular format.
 */

import Immutable from 'immutable';
import padStart from 'lodash-es/padStart';
import property from 'lodash-es/property';
import round from 'lodash-es/round';
import u from 'updeep';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import FilterableSortableTable, {
  FilterTypes
} from '../../components/FilterableSortableTable';

import Flock from '../../model/flock';

/**
 * Function for assigning a color based on a percentage value.
 * The colors are red, yellow and green from the solarized palette.
 *
 * @param {number} percentage The given percentage value.
 * @return {string} The assigned color as a hex string.
 */
const colorForPercentage = percentage =>
  ['#dc322f', '#b58900', '#859900'][Math.floor(percentage / 34)];

class GroundControlViewPresentation extends React.Component {
  static propTypes = {
    flock: PropTypes.instanceOf(Flock)
  };

  state = {
    uavs: Immutable.List(),
    uavIdToIndex: Immutable.Map()
  };

  constructor(props) {
    super(props);

    this._eventBindings = {};

    this.tableColumns = [
      {
        name: 'Name',
        width: 125,
        dataExtractor: property('id'),
        filterType: FilterTypes.text
      },
      {
        name: 'Battery voltage',
        width: 175,
        dataExtractor: property('battery'),
        displayRenderer: data => (
          <span style={{ color: colorForPercentage(data.percentage) }}>
            {`${round(data.voltage, 2)}V (${round(data.percentage, 2)}%)`}
          </span>
        ),
        sorter: (a, b) => a.voltage - b.voltage,
        filterType: FilterTypes.range
      },
      {
        name: 'Latitude',
        width: 150,
        dataExtractor: property('lat'),
        filterType: FilterTypes.range
      },
      {
        name: 'Longitude',
        width: 150,
        dataExtractor: property('lon'),
        filterType: FilterTypes.range
      },
      {
        name: 'Heading',
        width: 150,
        dataExtractor: property('heading'),
        filterType: FilterTypes.range
      },
      {
        name: 'Updated',
        width: 150,
        dataExtractor: property('lastUpdated'),
        displayRenderer: data => {
          const currentDate = new Date(data);
          return (
            padStart(currentDate.getHours(), 2, '0') +
            ':' +
            padStart(currentDate.getMinutes(), 2, '0') +
            ':' +
            padStart(currentDate.getSeconds(), 2, '0')
          );
        },
        filterType: FilterTypes.range
      },
      {
        name: 'Error',
        width: 150,
        dataExtractor: property('error'),
        filterType: FilterTypes.range
      }
    ];
  }

  componentDidUpdate(oldProps) {
    this._onFlockMaybeChanged(oldProps.flock, this.props.flock);
  }

  componentDidMount() {
    this._onFlockMaybeChanged(undefined, this.props.flock);
  }

  componentWillUnmount() {
    this._onFlockMaybeChanged(this.props.flock, undefined);
  }

  /**
   * Function that is called when we suspect that the flock associated to
   * the component may have changed.
   *
   * This function subscribes to the events from the new flock and
   * unsubscribes from the events of the old flock. It also performs a
   * strict equality check on the two flocks because they may be equal.
   *
   * @param {Flock} oldFlock The old flock associated to the component.
   * @param {Flock} newFlock The new flock associated to the component.
   */
  _onFlockMaybeChanged = (oldFlock, newFlock) => {
    if (oldFlock === newFlock) {
      return;
    }

    if (oldFlock) {
      oldFlock.uavsUpdated.detach(this._eventBindings.uavsUpdated);
      delete this._eventBindings.uavsUpdated;
    }

    if (newFlock) {
      this._eventBindings.uavsUpdated = newFlock.uavsUpdated.add(
        this._onUAVsUpdated
      );
    }
  };

  /**
   * Event handler that is called when the status of some of the UAVs has
   * changed in the flock and thus the table should be re-rendered.
   *
   * @listens Flock#uavsUpdated
   * @param {UAV[]} updatedUavs The UAVs that should be refreshed.
   */
  _onUAVsUpdated = updatedUavs => {
    let { uavs, uavIdToIndex } = this.state;

    for (const uav of updatedUavs) {
      const index = uavIdToIndex.get(uav.id);
      const uavRepr = this._pickRelevantUAVProps(uav);

      if (index === undefined) {
        uavIdToIndex = uavIdToIndex.set(uav.id, uavs.size);
        uavs = uavs.push(uavRepr);
      } else {
        uavs = uavs.set(index, uavRepr);
      }
    }

    const newState = u({ uavs, uavIdToIndex }, this.state);
    this.setState(newState);

    this.forceUpdate();
  };

  /**
   * Picks the properties from an UAV object that are displayed in the table.
   *
   * @param {UAV} uav The UAV to pick the properties from.
   * @return {Object} The object containing the picked props.
   */
  _pickRelevantUAVProps(uav) {
    return {
      id: uav.id,
      lastUpdated: uav.lastUpdated,
      lat: uav.lat,
      lon: uav.lon,
      heading: uav.heading,
      error: uav.error,
      battery: uav.battery
    };
  }

  render() {
    return (
      <FilterableSortableTable
        dataSource={this.state.uavs.toJS()}
        availableColumns={this.tableColumns}
      />
    );
  }
}

const GroundControlView = connect(
  // mapStateToProps
  state => ({}),
  // mapDispatchToProps
  dispatch => ({})
)(GroundControlViewPresentation);

export default GroundControlView;

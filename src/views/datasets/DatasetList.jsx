/**
 * @file Component that displays the list datasets.
 */

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { listOf } from '~/components/helpers/lists';
import { getDatasetsInOrder } from '~/selectors/ordered';

/**
 * Presentation component for representing a single dataset in a dataset list.
 *
 * @param  {Object} props  the properties of the component
 * @return {Object} the React presentation component
 */
const DatasetListEntry = props => (
  <ListItem>
    <ListItemText primary="Dataset" />
  </ListItem>
);

DatasetListEntry.propTypes = {
  /** The epoch time of the clock, i.e. the number of seconds since the
   * UNIX epoch when the tick count of the clock was zero. If this is
   * given, the clock display will show a regular date. If this is not
   * specified, the clock display will show the date in
   * hours:minutes:seconds:ticks format.
   */
  epoch: PropTypes.number,
  /** The format to use for displaying the clock value */
  format: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  /** The identifier of the clock */
  id: PropTypes.string.isRequired,
  /**
   * The reference time in the local clock that corresponds to the tick
   * value stored in the 'ticks' property, expressed in the number of
   * seconds elapsed since the Unix epoch.
   */
  referenceTime: PropTypes.number.isRequired,
  /**
   * The current number of clock ticks that should be shown.
   */
  ticks: PropTypes.number.isRequired,
  /**
   * The number of clock ticks per second.
   */
  ticksPerSecond: PropTypes.number.isRequired,
  /** Whether the clock is running according to the Flockwave server */
  running: PropTypes.bool.isRequired,
  /**
   * The update frequency of the clock display when it is running, expressed
   * in milliseconds. The clock display will be refreshed once in every
   * X milliseconds.
   */
  updateFrequency: PropTypes.number.isRequired
};

DatasetListEntry.defaultProps = {};

/**
 * Presentation component for showing a list of datasets.
 *
 * @return  {Object}  the rendered dataset list component
 */
const DatasetListPresentation = listOf(DatasetListEntry, {
  dataProvider: 'datasets',
  backgroundHint: 'No datasets'
});
DatasetListPresentation.displayName = 'DatasetListPresentation';

/**
 * Smart component for showing the list of the known datasets from the Redux
 * store.
 */
const DatasetList = connect(
  // mapStateToProps
  state => ({
    datasets: getDatasetsInOrder(state),
    dense: true
  }),
  // mapDispatchToProps
  undefined
)(DatasetListPresentation);

export default DatasetList;

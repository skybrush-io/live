/**
 * @file Component that displays the list datasets.
 */

import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { listOf } from '~/components/helpers/lists';
import { getDatasetsInOrder } from '~/features/datasets/selectors';

/**
 * Presentation component for representing a single dataset in a dataset list.
 *
 * @param  {Object} props  the properties of the component
 * @return {Object} the React presentation component
 */
const DatasetListEntry = () => (
  <ListItem>
    <ListItemText primary='Dataset' />
  </ListItem>
);

DatasetListEntry.propTypes = {
  /** The identifier of the dataset */
  id: PropTypes.string.isRequired,
};

/**
 * Presentation component for showing a list of datasets.
 *
 * @return  {Object}  the rendered dataset list component
 */
const DatasetListPresentation = listOf(DatasetListEntry, {
  backgroundHint: 'No datasets',
  dataProvider: 'datasets',
  displayName: 'DatasetListPresentation',
});

/**
 * Smart component for showing the list of the known datasets from the Redux
 * store.
 */
const DatasetList = connect(
  // mapStateToProps
  (state) => ({
    datasets: getDatasetsInOrder(state),
    dense: true,
  }),
  // mapDispatchToProps
  undefined
)(DatasetListPresentation);

export default DatasetList;

/**
 * @file Component that displays the list datasets.
 */

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';

import DroneAvatar from './DroneAvatar';
import DroneListItem from './DroneListItem';

import { getUAVIdList } from '~/features/uavs/selectors';
import { getSelectedUAVIds } from '~/selectors/selection';

const drones = [
  {
    id: '1',
    progress: 30,
    status: 'success',
    secondaryStatus: 'off',
    text: 'Armed',
    textSemantics: 'success'
  },
  {
    id: '2',
    crossed: true,
    status: 'rth'
  },
  {
    id: '3',
    status: 'warning'
  },
  {
    id: '4',
    status: 'error'
  },
  {
    id: '5',
    status: 'critical'
  }
];

/**
 * Presentation component for showing the drone show configuration view.
 */
const ConfigurationViewPresentation = ({ selectedUAVIds, uavIds }) => (
  <Box display="flex" flexDirection="row" flexWrap="wrap" px={1} py={2}>
    {uavIds.map(uavId => (
      <DroneListItem key={uavId} selected={selectedUAVIds.includes(uavId)}>
        <DroneAvatar
          key={uavId}
          id={uavId}
          selected={selectedUAVIds.includes(uavId)}
        />
      </DroneListItem>
    ))}
  </Box>
);

ConfigurationViewPresentation.propTypes = {
  selectedUAVIds: PropTypes.array,
  uavIds: PropTypes.array
};

/**
 * Smart component for showing the drone show configuration view.
 */
const ConfigurationView = connect(
  // mapStateToProps
  state => ({
    dense: true,
    selectedUAVIds: getSelectedUAVIds(state),
    uavIds: getUAVIdList(state)
  }),
  // mapDispatchToProps
  undefined
)(ConfigurationViewPresentation);

export default ConfigurationView;

/**
 * @file Component that displays the list datasets.
 */

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';

import DroneAvatar from './DroneAvatar';

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
const ConfigurationViewPresentation = ({ drones }) => (
  <Box display="flex" flexDirection="row" flexWrap="wrap" px={1} py={2}>
    {drones.map(drone => (
      <DroneAvatar key={drone.id} {...drone} />
    ))}
  </Box>
);

ConfigurationViewPresentation.propTypes = {
  drones: PropTypes.array
};

/**
 * Smart component for showing the drone show configuration view.
 */
const ConfigurationView = connect(
  // mapStateToProps
  () => ({
    dense: true,
    drones
  }),
  // mapDispatchToProps
  undefined
)(ConfigurationViewPresentation);

export default ConfigurationView;

import capitalize from 'lodash-es/capitalize';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

import { getSelectedTabInUAVDetailsPanel } from '~/features/uavs/selectors';
import { setSelectedTabInUAVDetailsPanel } from '~/features/uavs/slice';

import { views } from './UAVDetailsPanelBody';

/**
 * Dropdown menu for selecting a view on the UAV Details Panel.
 */
const UAVDetailsPanelSelect = ({ ...rest }) => (
  <Select style={{ width: 128, textAlign: 'center' }} {...rest}>
    {Object.keys(views).map((view) => (
      <MenuItem key={view} value={view}>
        {capitalize(view)}
      </MenuItem>
    ))}
  </Select>
);

UAVDetailsPanelSelect.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state) => ({ value: getSelectedTabInUAVDetailsPanel(state) }),

  // mapDispatchToProps
  { onChange: (event) => setSelectedTabInUAVDetailsPanel(event.target.value) }
)(UAVDetailsPanelSelect);

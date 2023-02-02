import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';

import { getSelectedTabInUAVDetailsPanel } from '~/features/uavs/selectors';
import { setSelectedTabInUAVDetailsPanel } from '~/features/uavs/slice';

import { views } from './UAVDetailsPanelBody';

/**
 * Tab list for selecting a view on the UAV Details Panel.
 */
const UAVDetailsPanelTabs = ({ ...rest }) => (
  <Tabs {...rest}>
    {Object.keys(views).map((view) => (
      <Tab key={view} label={view} value={view} />
    ))}
  </Tabs>
);

UAVDetailsPanelTabs.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state) => ({ value: getSelectedTabInUAVDetailsPanel(state) }),

  // mapDispatchToProps
  { onChange: (_event, value) => setSelectedTabInUAVDetailsPanel(value) }
)(UAVDetailsPanelTabs);

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Tab from '@material-ui/core/Tab';

import DialogTabs from '@skybrush/mui-components/lib/DialogTabs';

import {
  getSelectedTabInLPSDetailsDialog,
  setSelectedTabInLPSDetailsDialog,
} from './details';

/**
 * Presentation component for the dialog that allows the user to inspect the
 * details of a specific UAV.
 */
const LPSDetailsDialogTabs = ({ dragHandleId, ...rest }) => (
  <DialogTabs alignment='left' dragHandle={dragHandleId} {...rest}>
    <Tab label='Anchors' value='anchors' />
  </DialogTabs>
);

LPSDetailsDialogTabs.propTypes = {
  dragHandleId: PropTypes.string,
  value: PropTypes.string,
};

LPSDetailsDialogTabs.defaultProps = {
  value: 'preflight',
};

export default connect(
  // mapStateToProps
  (state) => ({
    value: getSelectedTabInLPSDetailsDialog(state),
  }),

  // mapDispatchToProps
  {
    onChange: (_event, value) => setSelectedTabInLPSDetailsDialog(value),
  }
)(LPSDetailsDialogTabs);

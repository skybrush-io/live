import Tab from '@mui/material/Tab';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { DialogTabs } from '@skybrush/mui-components';

import {
  getSelectedTabInDockDetailsDialog,
  setSelectedTabInDockDetailsDialog,
} from './details';

/**
 * Presentation component for the dialog that allows the user to inspect the
 * details of a specific docking station.
 */
const DockDetailsDialogTabs = ({ dragHandleId, value = 'status', ...rest }) => (
  <DialogTabs
    alignment='left'
    dragHandle={dragHandleId}
    value={value}
    {...rest}
  >
    <Tab label='Status' value='status' />
    <Tab label='Schedule' value='schedule' />
    <Tab label='Storage' value='storage' />
    <Tab label='Live cam' value='liveCam' />
  </DialogTabs>
);

DockDetailsDialogTabs.propTypes = {
  dragHandleId: PropTypes.string,
  value: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state) => ({
    value: getSelectedTabInDockDetailsDialog(state),
  }),

  // mapDispatchToProps
  {
    onChange: (_event, value) => setSelectedTabInDockDetailsDialog(value),
  }
)(DockDetailsDialogTabs);

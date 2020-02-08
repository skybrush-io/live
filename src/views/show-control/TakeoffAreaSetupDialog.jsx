import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Dialog from '@material-ui/core/Dialog';
import FormGroup from '@material-ui/core/FormGroup';

import FormHeader from '~/components/dialogs/FormHeader';

/**
 * Presentation component for the dialog that allows the user to validate whether
 * all drones are properly placed in their takeoff positions.
 */
const TakeoffAreaSetupDialog = ({ editing, onClose }) => (
  <Dialog fullWidth open={editing} maxWidth="sm" onClose={onClose}>
    <Box m={3}>
      <FormGroup>
        <FormHeader>Mapping to takeoff positions</FormHeader>
      </FormGroup>

      <FormGroup>
        <FormHeader>Distances</FormHeader>
      </FormGroup>

      <FormGroup>
        <FormHeader>Headings</FormHeader>
      </FormGroup>
    </Box>
  </Dialog>
);

TakeoffAreaSetupDialog.propTypes = {
  editing: PropTypes.bool,
  onClose: PropTypes.func
};

TakeoffAreaSetupDialog.defaultProps = {
  editing: false
};

export default connect(
  // mapStateToProps
  state => ({}),

  // mapDispatchToProps
  dispatch => ({})
)(TakeoffAreaSetupDialog);

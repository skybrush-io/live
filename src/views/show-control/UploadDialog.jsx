import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import { closeUploadDialog } from '~/features/show/slice';

import UploadDialogContent from './UploadDialogContent';

const UploadDialog = ({ open, onClose }) => {
  return (
    <DraggableDialog
      fullWidth
      open={open}
      maxWidth='sm'
      title='Upload show data'
      onClose={onClose}
    >
      <UploadDialogContent />
    </DraggableDialog>
  );
};

UploadDialog.propTypes = {
  onClose: PropTypes.func,
  open: PropTypes.bool,
};

UploadDialog.defaultProps = {
  open: false,
};

// TODO(ntamas): most selectors should return a combination of show and
// drone IDs

export default connect(
  // mapStateToProps
  (state) => ({
    ...state.show.uploadDialog,
    // open: true,
  }),

  // mapDispatchToProps
  {
    onClose: closeUploadDialog,
  }
)(UploadDialog);

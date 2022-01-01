import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import { getUploadDialogState } from '~/features/upload/selectors';
import { closeUploadDialog } from '~/features/upload/slice';

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

export default connect(
  // mapStateToProps
  getUploadDialogState,

  // mapDispatchToProps
  {
    onClose: closeUploadDialog,
  }
)(UploadDialog);

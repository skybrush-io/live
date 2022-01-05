import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import { getUploadDialogState } from '~/features/upload/selectors';
import { closeUploadDialog } from '~/features/upload/slice';

import UploadDialogContent from './UploadDialogContent';

const UploadDialog = () => {
  const { open = false } = useSelector(getUploadDialogState);
  const dispatch = useDispatch();
  return (
    <DraggableDialog
      fullWidth
      open={open}
      maxWidth='sm'
      title='Upload show data'
      onClose={() => {
        dispatch(closeUploadDialog());
      }}
    >
      <UploadDialogContent />
    </DraggableDialog>
  );
};

export default UploadDialog;

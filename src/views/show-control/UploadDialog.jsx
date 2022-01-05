import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import { getUAVIdsParticipatingInMissionSortedByMissionIndex } from '~/features/mission/selectors';
import { getNumberOfDronesInShow } from '~/features/show/selectors';
import { startUploadWithUavIdsFromSelector } from '~/features/upload/actions';
import { getUploadDialogState } from '~/features/upload/selectors';
import { closeUploadDialog } from '~/features/upload/slice';
import UploadPanel from '~/features/upload/UploadPanel';

const hasAtLeastOneDroneInShow = (state) => getNumberOfDronesInShow(state) > 0;

const UploadDialog = () => {
  const { open = false } = useSelector(getUploadDialogState);
  const canStartUpload = useSelector(hasAtLeastOneDroneInShow);
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
      <UploadPanel
        onStartUpload={
          canStartUpload
            ? () => {
                dispatch(
                  startUploadWithUavIdsFromSelector(
                    getUAVIdsParticipatingInMissionSortedByMissionIndex
                  )
                );
              }
            : null
        }
      />
    </DraggableDialog>
  );
};

export default UploadDialog;

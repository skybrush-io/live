import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import isNil from 'lodash-es/isNil';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { DraggableDialog } from '@skybrush/mui-components';

import { JOB_TYPE as FIRMWARE_UPDATE_JOB_TYPE } from '~/features/firmware-update/constants';
import FirmwareUpdateSupportFetcher from '~/features/firmware-update/FirmwareUpdateSupportFetcher';
import type { RootState } from '~/store/reducers';

import {
  closeUploadDialogAndStepBack,
  startUploadJobFromUploadDialog,
} from './actions';
import AnotherJobTypeRunningHint from './AnotherJobTypeRunningHint';
import { getDialogTitleForJobType } from './jobs';
import {
  getRunningUploadJobType,
  getSelectedJobInUploadDialog,
  getUploadDialogState,
  shouldRestrictToGlobalSelection,
} from './selectors';
import { closeUploadDialog, toggleRestrictToGlobalSelection } from './slice';
import UploadPanel from './UploadPanel';

type UploadDialogProps = Readonly<{
  canGoBack: boolean;
  canStartUpload: boolean;
  onClose: () => void;
  onStartUpload: () => void;
  onStepBack: () => void;
  open: boolean;
  restrictToGlobalSelection: boolean;
  runningJobType?: string;
  selectedJobType?: string;
  toggleRestrictToGlobalSelection: () => void;
}>;

const UploadDialog = ({
  canGoBack,
  canStartUpload,
  restrictToGlobalSelection,
  onClose,
  onStartUpload,
  onStepBack,
  open,
  runningJobType,
  selectedJobType,
  toggleRestrictToGlobalSelection,
}: UploadDialogProps): JSX.Element => {
  const { t } = useTranslation();
  const isRunningJobTypeMatching =
    !runningJobType || runningJobType === selectedJobType;

  return (
    <DraggableDialog
      fullWidth
      open={Boolean(open)}
      maxWidth='md'
      title={getDialogTitleForJobType(selectedJobType ?? '')}
      titleComponents={
        <>
          {t('uploadDialog.restrictToGlobalSelection')}
          <Switch
            checked={restrictToGlobalSelection}
            onChange={(evt) => {
              toggleRestrictToGlobalSelection();
              evt.target.blur();
            }}
          />
        </>
      }
      onClose={onClose}
    >
      {selectedJobType === FIRMWARE_UPDATE_JOB_TYPE && (
        <FirmwareUpdateSupportFetcher />
      )}
      {isRunningJobTypeMatching ? (
        <UploadPanel
          jobType={selectedJobType ?? ''}
          onStepBack={canGoBack ? onStepBack : undefined}
          onStartUpload={canStartUpload ? onStartUpload : undefined}
        />
      ) : (
        <Box sx={{ height: '240px' }}>
          <AnotherJobTypeRunningHint type={runningJobType} />
        </Box>
      )}
    </DraggableDialog>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => {
    const { open, backAction } = getUploadDialogState(state);
    return {
      open,
      canGoBack: !isNil(backAction),
      canStartUpload: true,
      restrictToGlobalSelection: shouldRestrictToGlobalSelection(state),
      runningJobType: getRunningUploadJobType(state),
      selectedJobType: getSelectedJobInUploadDialog(state)?.type,
    };
  },
  // mapDispatchToProps
  {
    onClose: closeUploadDialog,
    onStartUpload: startUploadJobFromUploadDialog,
    onStepBack: closeUploadDialogAndStepBack,
    toggleRestrictToGlobalSelection,
  }
)(UploadDialog);

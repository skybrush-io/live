import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import isNil from 'lodash-es/isNil';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { DraggableDialog } from '@skybrush/mui-components';

import { JOB_TYPE as FIRMWARE_UPDATE_JOB_TYPE } from '~/features/firmware-update/constants';
import FirmwareUpdateSupportFetcher from '~/features/firmware-update/FirmwareUpdateSupportFetcher';
import type { RootState } from '~/store/reducers';

import { closeUploadDialogAndStepBack } from './actions';
import AnotherJobTypeRunningHint from './AnotherJobTypeRunningHint';
import { getDialogTitleForJobType } from './jobs';
import { getUploadJobResultPanel } from './result-panels';
import {
  getRunningUploadJobType,
  getSelectedJobTypeInUploadDialog,
  getSelectedTabInUploadDialog,
  getUploadDialogState,
  shouldRestrictToGlobalSelection,
} from './selectors';
import { closeUploadDialog, toggleRestrictToGlobalSelection } from './slice';
import type { UploadDialogTab } from './types';
import UploadPanel from './UploadPanel';

type UploadDialogProps = Readonly<{
  canGoBack: boolean;
  onClose: () => void;
  onStepBack: () => void;
  open: boolean;
  restrictToGlobalSelection: boolean;
  runningJobType?: string;
  selectedJobType?: string;
  selectedTab?: UploadDialogTab;
  toggleRestrictToGlobalSelection: () => void;
}>;

const UploadDialog = ({
  canGoBack,
  restrictToGlobalSelection,
  onClose,
  onStepBack,
  open,
  runningJobType,
  selectedJobType,
  selectedTab,
  toggleRestrictToGlobalSelection,
}: UploadDialogProps): React.JSX.Element => {
  const { t } = useTranslation();
  const isRunningJobTypeMatching =
    !runningJobType || runningJobType === selectedJobType;
  const hideRestrictToGlobalSelectionSwitch =
    getUploadJobResultPanel(selectedJobType ?? '') !== undefined &&
    selectedTab === 'results';

  return (
    <DraggableDialog
      fullWidth
      open={Boolean(open)}
      maxWidth='md'
      title={getDialogTitleForJobType(selectedJobType ?? '')}
      titleComponents={
        hideRestrictToGlobalSelectionSwitch ? undefined : (
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
        )
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
      restrictToGlobalSelection: shouldRestrictToGlobalSelection(state),
      runningJobType: getRunningUploadJobType(state),
      selectedJobType: getSelectedJobTypeInUploadDialog(state),
      selectedTab: getSelectedTabInUploadDialog(state),
    };
  },
  // mapDispatchToProps
  {
    onClose: closeUploadDialog,
    onStepBack: closeUploadDialogAndStepBack,
    toggleRestrictToGlobalSelection,
  }
)(UploadDialog);

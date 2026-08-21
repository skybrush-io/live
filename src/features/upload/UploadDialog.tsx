import Switch from '@mui/material/Switch';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { DraggableDialog } from '@skybrush/mui-components';

import type { RootState } from '~/store/reducers';

import { getDialogTitleForJobType } from './jobs';
import {
  getSelectedJobTypeInUploadDialog,
  getSelectedTabInUploadDialog,
  getUploadDialogState,
  shouldRestrictToGlobalSelection,
} from './selectors';
import { closeUploadDialog, toggleRestrictToGlobalSelection } from './slice';
import type { UploadDialogTab } from './types';
import UploadDialogBottomArea from './UploadDialogBottomArea';
import UploadDialogContent from './UploadDialogContent';

type UploadDialogProps = Readonly<{
  jobType: string;
  onClose: () => void;
  open: boolean;
  restrictToGlobalSelection: boolean;
  selectedTab?: UploadDialogTab;
  toggleRestrictToGlobalSelection: () => void;
}>;

const UploadDialog = ({
  restrictToGlobalSelection,
  onClose,
  open,
  jobType,
  selectedTab,
  toggleRestrictToGlobalSelection,
}: UploadDialogProps): React.JSX.Element => {
  const { t } = useTranslation();
  const showRestrictToGlobalSelectionSwitch = selectedTab === 'status';

  return (
    <DraggableDialog
      fullWidth
      open={Boolean(open)}
      maxWidth='md'
      title={getDialogTitleForJobType(jobType)}
      titleComponents={
        showRestrictToGlobalSelectionSwitch && (
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
      <UploadDialogContent />
      <UploadDialogBottomArea />
    </DraggableDialog>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => {
    const { open } = getUploadDialogState(state);
    return {
      jobType: getSelectedJobTypeInUploadDialog(state) ?? '',
      open,
      restrictToGlobalSelection: shouldRestrictToGlobalSelection(state),
      selectedTab: getSelectedTabInUploadDialog(state),
    };
  },
  // mapDispatchToProps
  {
    onClose: closeUploadDialog,
    toggleRestrictToGlobalSelection,
  }
)(UploadDialog);
